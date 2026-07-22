/**
 * Regex/plain-text pattern search with surrounding context lines
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { SearchResult, SearchOptions } from '../types.js';
import { verifyFile } from './metadata.js';

/**
 * Search for pattern in file
 */
export async function search(
  filePath: string,
  pattern: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  await verifyFile(filePath);

  const results: SearchResult[] = [];
  const maxResults = options.maxResults || 100;
  const contextBefore = options.contextBefore || 2;
  const contextAfter = options.contextAfter || 2;

  const regex = options.regex
    ? new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
    : new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        options.caseSensitive ? 'g' : 'gi'
      );

  return new Promise((resolve, reject) => {
    let lineNumber = 0;
    const lineBuffer: string[] = [];
    // Results still waiting for their contextAfter lines to be collected.
    const pendingContext: SearchResult[] = [];
    let maxResultsReached = false;

    const stream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity,
    });

    rl.on('line', line => {
      lineNumber++;
      lineBuffer.push(line);

      // Keep buffer for context
      if (lineBuffer.length > contextBefore + contextAfter + 1) {
        lineBuffer.shift();
      }

      // Check if within search range
      if (options.startLine && lineNumber < options.startLine) return;
      if (options.endLine && lineNumber > options.endLine) {
        rl.close();
        return;
      }

      // Feed this line to every result still collecting contextAfter
      // (not just the most recent one, so closely-spaced matches each
      // get their own trailing context).
      for (let i = pendingContext.length - 1; i >= 0; i--) {
        const pending = pendingContext[i];
        pending.contextAfter.push(line);
        if (pending.contextAfter.length >= contextAfter) {
          pendingContext.splice(i, 1);
        }
      }

      // Search for pattern
      const matches = maxResultsReached ? [] : Array.from(line.matchAll(regex));
      if (matches.length > 0) {
        const matchPositions = matches.map(m => ({
          start: m.index!,
          end: m.index! + m[0].length,
        }));

        const bufferIndex = lineBuffer.length - 1;
        const before = lineBuffer.slice(Math.max(0, bufferIndex - contextBefore), bufferIndex);

        const result: SearchResult = {
          lineNumber,
          lineContent: line,
          matchPositions,
          contextBefore: before,
          contextAfter: [],
          chunkIndex: Math.floor((lineNumber - 1) / 500),
        };
        results.push(result);

        if (contextAfter > 0) {
          pendingContext.push(result);
        }

        if (results.length >= maxResults) {
          maxResultsReached = true;
        }
      }

      // Once maxResults is hit, keep reading only until every already
      // matched result has its contextAfter filled in, then stop.
      if (maxResultsReached && pendingContext.length === 0) {
        rl.close();
      }
    });

    rl.on('close', () => resolve(results));
    rl.on('error', reject);
  });
}
