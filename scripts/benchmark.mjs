#!/usr/bin/env node
/**
 * Benchmark script for the README "Performance" section.
 *
 * Measures real numbers on real generated fixtures instead of hand-typed
 * estimates: (1) FileHandler.readChunk() latency for a few file-size tiers,
 * and (2) CacheManager hit-rate under a documented, repeatable access
 * pattern. Re-run with `pnpm run benchmark` whenever these numbers need
 * refreshing; results depend on the machine they run on, so treat them as
 * a reproducible reference point, not a universal guarantee.
 *
 * Requires a build first: `pnpm build && node scripts/benchmark.mjs`.
 */

import { mkdtempSync, rmSync, openSync, writeSync, closeSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { FileHandler } from '../dist/fileHandler.js';
import { CacheManager } from '../dist/cacheManager.js';

const LINE = 'The quick brown fox jumps over the lazy dog. 0123456789.\n';
const LINE_BYTES = Buffer.byteLength(LINE, 'utf-8');

function makeFile(dir, name, targetBytes) {
  const filePath = join(dir, name);
  const totalLines = Math.ceil(targetBytes / LINE_BYTES);
  const linesPerWrite = 10000;
  const bigChunk = LINE.repeat(linesPerWrite);

  const fd = openSync(filePath, 'w');
  let written = 0;
  while (written < totalLines) {
    const remaining = totalLines - written;
    if (remaining >= linesPerWrite) {
      writeSync(fd, bigChunk);
      written += linesPerWrite;
    } else {
      writeSync(fd, LINE.repeat(remaining));
      written += remaining;
    }
  }
  closeSync(fd);
  return filePath;
}

async function benchmarkReadLatency(filePath) {
  const start = performance.now();
  await FileHandler.readChunk(filePath, 0);
  return performance.now() - start;
}

/**
 * Simulates a realistic navigation pattern: a handful of "hot" chunks get
 * revisited far more often than "cold" ones (e.g. re-reading the same
 * function definition while a user asks follow-up questions).
 */
function benchmarkCacheHitRate() {
  const cache = new CacheManager({
    enabled: true,
    maxSize: 10 * 1024 * 1024,
    ttl: 5 * 60 * 1000,
  });

  const hotKeys = ['chunk:0', 'chunk:1', 'chunk:2'];
  const coldKeys = Array.from({ length: 10 }, (_, i) => `chunk:cold-${i}`);
  const accessPattern = [];
  for (let i = 0; i < 100; i++) {
    // 80% of accesses hit one of the 3 hot chunks, 20% hit a unique cold one.
    accessPattern.push(i % 5 === 0 ? coldKeys[i % coldKeys.length] : hotKeys[i % hotKeys.length]);
  }

  let hits = 0;
  let misses = 0;
  for (const key of accessPattern) {
    const cached = cache.get(key);
    if (cached !== undefined) {
      hits++;
    } else {
      misses++;
      cache.set(key, key.repeat(100));
    }
  }

  return {
    totalAccesses: accessPattern.length,
    hits,
    misses,
    hitRatePercent: Math.round((hits / accessPattern.length) * 100),
  };
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), 'large-file-mcp-bench-'));

  try {
    const tiers = [
      { label: '~500KB', bytes: 500 * 1024 },
      { label: '~5MB', bytes: 5 * 1024 * 1024 },
      { label: '~50MB', bytes: 50 * 1024 * 1024 },
    ];

    console.log('## Read latency (uncached, readChunk on chunk 0)\n');
    for (const tier of tiers) {
      const filePath = makeFile(dir, `${tier.label}.txt`, tier.bytes);
      const elapsedMs = await benchmarkReadLatency(filePath);
      console.log(`${tier.label.padEnd(8)} -> ${elapsedMs.toFixed(1)}ms`);
    }

    console.log('\n## Cache hit-rate (100 accesses, 3 hot + 10 cold keys, 80/20 split)\n');
    const cacheResult = benchmarkCacheHitRate();
    console.log(
      `${cacheResult.hits}/${cacheResult.totalAccesses} hits -> ${cacheResult.hitRatePercent}% hit rate`
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
