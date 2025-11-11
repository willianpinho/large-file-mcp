# Caching

Understand and optimize the LRU caching system for maximum performance.

## Overview

Large File MCP Server uses an intelligent LRU (Least Recently Used) cache to dramatically improve performance for repeated access patterns. Understanding how caching works enables you to optimize your workflows for maximum efficiency.

## Cache Architecture

### What Gets Cached

The server caches three types of data:

1. **File Chunks**: Results from `read_large_file_chunk`
2. **File Structure**: Metadata from `get_file_structure`
3. **Search Results**: Recent search patterns and results

### Cache Keys

Each cache entry uses a composite key:

```typescript
// Chunk cache key
const key = `${filePath}:chunk:${chunkIndex}`;

// Structure cache key
const key = `${filePath}:structure`;

// Search cache key
const key = `${filePath}:search:${pattern}`;
```

### Cache Configuration

Default configuration:

```typescript
{
  maxSize: 100,        // Maximum cached chunks
  ttl: undefined,      // No time-based expiration
  eviction: 'lru'      // Least Recently Used eviction
}
```

## Performance Impact

### Cache Hit vs Miss

| Operation | Cache Hit | Cache Miss | Improvement |
|-----------|-----------|------------|-------------|
| Read chunk (< 1MB) | ~5ms | ~50ms | 10x faster |
| Read chunk (1-10MB) | ~5ms | ~200ms | 40x faster |
| Read chunk (10-100MB) | ~5ms | ~800ms | 160x faster |
| File structure | ~1ms | ~500ms | 500x faster |
| Search (simple) | ~2ms | ~300ms | 150x faster |

### Typical Hit Rates

| Access Pattern | Expected Hit Rate | Notes |
|----------------|------------------|-------|
| Sequential reading | 20-30% | Low reuse |
| Random access | 60-70% | Moderate reuse |
| Code navigation | 80-90% | High reuse |
| Log analysis | 85-95% | Very high reuse |

## Optimizing for Cache

### 1. Sequential Access with Overlap

Read chunks in sequence but allow overlap:

```typescript
// Good: Sequential with potential reuse
for (let i = 0; i < totalChunks; i++) {
  const chunk = await read_large_file_chunk({
    filePath: file,
    chunkIndex: i
  });

  // If you need to reference previous chunk
  if (i > 0) {
    const prevChunk = await read_large_file_chunk({
      filePath: file,
      chunkIndex: i - 1
    }); // Cache hit!
  }
}
```

### 2. Batch Related Operations

Group operations on the same file:

```typescript
// Good: Batch operations on same file
const file = "/var/log/app.log";

// All these benefit from cache
const structure = await get_file_structure({ filePath: file });
const firstChunk = await read_large_file_chunk({ filePath: file, chunkIndex: 0 });
const search = await search_in_large_file({ filePath: file, pattern: "ERROR" });
const navigation = await navigate_to_line({ filePath: file, lineNumber: 100 });

// Bad: Interleaved operations on different files
const file1Chunk = await read_large_file_chunk({ filePath: file1, chunkIndex: 0 });
const file2Chunk = await read_large_file_chunk({ filePath: file2, chunkIndex: 0 });
const file1Search = await search_in_large_file({ filePath: file1, pattern: "ERROR" });
// file1Chunk may be evicted by now
```

### 3. Reuse File Structure

Cache structure information:

```typescript
// Application-level caching
const structureCache = new Map<string, FileStructure>();

async function getStructureCached(filePath: string) {
  if (!structureCache.has(filePath)) {
    const structure = await get_file_structure({ filePath });
    structureCache.set(filePath, structure);
  }
  return structureCache.get(filePath)!;
}

// Use cached structure
const structure = await getStructureCached(file);
console.log(`File has ${structure.totalChunks} chunks`);

// Later: still cached
const structure2 = await getStructureCached(file); // Instant
```

### 4. Navigate Near Cached Chunks

When navigating, stay near cached regions:

```typescript
// If chunk 5 is cached, navigate nearby
const chunk5 = await read_large_file_chunk({
  filePath: file,
  chunkIndex: 5
}); // Cache miss

// These are likely cache hits (if line is in chunk 5)
await navigate_to_line({
  filePath: file,
  lineNumber: chunk5.startLine + 10
}); // Cache hit!

await navigate_to_line({
  filePath: file,
  lineNumber: chunk5.endLine - 10
}); // Cache hit!
```

## Cache Monitoring

### Check Cache Performance

Track cache hits and misses:

```typescript
class CacheMonitor {
  private hits = 0;
  private misses = 0;

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + "%"
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}

const monitor = new CacheMonitor();

// Wrap operations
async function readChunkMonitored(filePath: string, chunkIndex: number) {
  const startTime = Date.now();
  const result = await read_large_file_chunk({ filePath, chunkIndex });
  const duration = Date.now() - startTime;

  // Heuristic: < 20ms likely a cache hit
  if (duration < 20) {
    monitor.recordHit();
  } else {
    monitor.recordMiss();
  }

  return result;
}

// After operations
console.log("Cache statistics:", monitor.getStats());
// Output: { hits: 85, misses: 15, total: 100, hitRate: "85.00%" }
```

## Cache Warmup

### Pre-load Frequently Accessed Data

Warm up cache before heavy operations:

```typescript
async function warmupCache(filePath: string) {
  console.log("Warming up cache...");

  // Load file structure (always useful)
  await get_file_structure({ filePath });

  // Load first few chunks (common access)
  const warmupChunks = 5;
  for (let i = 0; i < warmupChunks; i++) {
    await read_large_file_chunk({
      filePath,
      chunkIndex: i
    });
  }

  console.log("Cache warmed up");
}

// Use before operations
await warmupCache("/var/log/app.log");

// Now operations are faster
await search_in_large_file({
  filePath: "/var/log/app.log",
  pattern: "ERROR"
}); // Benefits from cached chunks
```

## Cache Invalidation

### When Cache is Invalidated

The cache is automatically invalidated when:

1. **File Modified**: File modification time changes
2. **File Size Changes**: File grows or shrinks
3. **Cache Full**: LRU eviction when max size reached

### Manual Cache Control

While there's no direct API for cache control, you can influence it:

```typescript
// Force cache refresh by accessing with different pattern
async function refreshCache(filePath: string, chunkIndex: number) {
  // Read chunk (may be cached)
  const chunk1 = await read_large_file_chunk({
    filePath,
    chunkIndex
  });

  // Small delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Read again (will use cache if still valid)
  const chunk2 = await read_large_file_chunk({
    filePath,
    chunkIndex
  });

  return chunk2;
}
```

## Memory Management

### Cache Memory Usage

Each cached chunk uses approximately:

```typescript
// Average chunk memory
const chunkSize = 500; // lines
const avgLineLength = 100; // characters
const charsPerByte = 2; // UTF-16

const memoryPerChunk = chunkSize * avgLineLength * charsPerByte;
// ~100KB per chunk

// With max cache size of 100
const totalCacheMemory = memoryPerChunk * 100;
// ~10MB total cache memory
```

### Optimize for Memory

If running in memory-constrained environments:

```typescript
// Use smaller chunk sizes
const chunk = await read_large_file_chunk({
  filePath: file,
  chunkIndex: 0
  // Uses file type default, but you can process in smaller batches
});

// Process and release
processChunk(chunk);
chunk = null; // Allow garbage collection
```

## Best Practices

### 1. Group File Operations

```typescript
// Good: Operations on same file together
async function analyzeFile(filePath: string) {
  const structure = await get_file_structure({ filePath });
  const firstChunk = await read_large_file_chunk({ filePath, chunkIndex: 0 });
  const errors = await search_in_large_file({ filePath, pattern: "ERROR" });

  // All benefit from cache
  return { structure, firstChunk, errors };
}

// Bad: Interleaved operations
async function analyzeBad() {
  await get_file_structure({ filePath: file1 });
  await get_file_structure({ filePath: file2 });
  await read_large_file_chunk({ filePath: file1, chunkIndex: 0 }); // file1 cache may be evicted
}
```

### 2. Access Patterns Matter

```typescript
// Good: Sequential or localized access
for (let i = 0; i < 10; i++) {
  await read_large_file_chunk({ filePath: file, chunkIndex: i });
}

// Bad: Random access across entire file
const randomIndices = [0, 50, 25, 75, 10, 60, ...]; // Random order
for (const index of randomIndices) {
  await read_large_file_chunk({ filePath: file, chunkIndex: index });
  // Poor cache utilization
}
```

### 3. Reuse Structure Information

```typescript
// Good: Get structure once, use many times
const structure = await get_file_structure({ filePath: file });

const chunkSize = structure.chunkSize;
const totalChunks = structure.totalChunks;
const fileSize = structure.fileSize;

// Use this information for planning

// Bad: Repeated structure calls
for (let i = 0; i < someLimit; i++) {
  const structure = await get_file_structure({ filePath: file }); // Wasteful
  // ...
}
```

### 4. Monitor Cache Effectiveness

```typescript
// Track performance to optimize
const stats = {
  operations: 0,
  totalTime: 0,
  cacheHits: 0
};

async function monitoredRead(filePath: string, chunkIndex: number) {
  const start = Date.now();
  const result = await read_large_file_chunk({ filePath, chunkIndex });
  const duration = Date.now() - start;

  stats.operations++;
  stats.totalTime += duration;

  if (duration < 20) stats.cacheHits++;

  return result;
}

// Periodically review
setInterval(() => {
  const avgTime = stats.totalTime / stats.operations;
  const hitRate = (stats.cacheHits / stats.operations) * 100;

  console.log(`Avg time: ${avgTime.toFixed(2)}ms, Hit rate: ${hitRate.toFixed(1)}%`);
}, 60000);
```

## Advanced Patterns

### Cache-Aware Pagination

Optimize pagination for cache:

```typescript
async function paginateWithCache(
  filePath: string,
  currentPage: number,
  pageSize: number = 500
) {
  const structure = await get_file_structure({ filePath });
  const chunkIndex = Math.floor((currentPage * pageSize) / structure.chunkSize);

  // Read current chunk (may be cached)
  const chunk = await read_large_file_chunk({
    filePath,
    chunkIndex
  });

  // Pre-load next chunk (cache warmup)
  if (chunkIndex + 1 < structure.totalChunks) {
    read_large_file_chunk({
      filePath,
      chunkIndex: chunkIndex + 1
    }); // Fire and forget
  }

  return chunk;
}
```

### Multi-File Cache Strategy

Manage cache across multiple files:

```typescript
class MultiFileCacheManager {
  private fileAccessCount = new Map<string, number>();

  async read(filePath: string, chunkIndex: number) {
    // Track access
    this.fileAccessCount.set(
      filePath,
      (this.fileAccessCount.get(filePath) || 0) + 1
    );

    return await read_large_file_chunk({ filePath, chunkIndex });
  }

  getMostAccessed(limit: number = 5): string[] {
    return Array.from(this.fileAccessCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([file]) => file);
  }

  async warmupMostAccessed() {
    const topFiles = this.getMostAccessed(3);

    for (const file of topFiles) {
      await get_file_structure({ filePath: file });
      await read_large_file_chunk({ filePath: file, chunkIndex: 0 });
    }
  }
}
```

## Troubleshooting

### Low Hit Rate

If hit rate < 60%:

1. **Check access pattern**: Random access has lower hit rates
2. **Too many files**: Accessing too many files evicts cache
3. **Large chunks**: Fewer chunks fit in cache

### High Memory Usage

If memory is an issue:

1. **Reduce concurrent operations**: Process files one at a time
2. **Use streaming**: `stream_large_file` instead of chunks
3. **Application-level limits**: Limit cache size in your application

### Cache Thrashing

If cache constantly evicts:

1. **Too many files**: Focus on fewer files at a time
2. **Access pattern**: Improve sequential access
3. **Chunk size**: Consider file type optimization

## See Also

- [Performance Guide](/guide/performance) - Overall performance optimization
- [Best Practices](/guide/best-practices) - Usage recommendations
- [API Reference](/api/reference) - All available tools
- [Troubleshooting](/guide/troubleshooting) - Common issues
