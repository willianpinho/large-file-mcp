# Troubleshooting

Common issues and their solutions when working with Large File MCP Server.

## Common Issues

### File Not Found

**Error:**
```json
{
  "error": "File not found: /path/to/file.log",
  "code": "ENOENT"
}
```

**Causes:**
1. File path is incorrect
2. File was deleted or moved
3. Using relative path incorrectly

**Solutions:**

```typescript
// ✅ Use absolute paths
const filePath = path.resolve("/var/log/app.log");

// ✅ Check file exists first
if (fs.existsSync(filePath)) {
  const chunk = await read_large_file_chunk({ filePath, chunkIndex: 0 });
} else {
  console.error("File not found:", filePath);
}

// ✅ Handle errors gracefully
try {
  const chunk = await read_large_file_chunk({ filePath, chunkIndex: 0 });
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("File does not exist");
  }
}
```

### Permission Denied

**Error:**
```json
{
  "error": "Permission denied: /root/protected.log",
  "code": "EACCES"
}
```

**Causes:**
1. Insufficient file permissions
2. File owned by different user
3. Directory permissions restrict access

**Solutions:**

```typescript
// ✅ Check file permissions first
try {
  fs.accessSync(filePath, fs.constants.R_OK);
  // File is readable
} catch {
  console.error("No read permission");
}

// ✅ Use summary to check readability
const summary = await get_file_summary({ filePath });
if (!summary.isReadable) {
  console.error("File is not readable");
}

// ✅ Run with appropriate permissions
// On Unix: sudo node app.js
// Or: Change file ownership/permissions
```

### Out of Memory

**Error:**
```
FATAL ERROR: JavaScript heap out of memory
```

**Causes:**
1. Loading entire large file into memory
2. Processing too many files simultaneously
3. Not releasing references to large objects

**Solutions:**

```typescript
// ❌ BAD: Loading entire file
const content = fs.readFileSync(largeFile, "utf-8");

// ✅ GOOD: Use streaming
const stream = stream_large_file({
  filePath: largeFile,
  chunkSize: 1000
});

for await (const chunk of stream) {
  await processChunk(chunk);
  // Chunk is garbage collected after processing
}

// ✅ Process files one at a time
for (const file of files) {
  await processFile(file);
  // Complete one file before next
}

// ❌ BAD: Process all at once
await Promise.all(files.map(f => processFile(f)));
```

### Slow Performance

**Symptoms:**
- Operations taking seconds instead of milliseconds
- High CPU usage
- Slow response times

**Diagnosis:**

```typescript
// Measure operation time
const start = Date.now();
const result = await read_large_file_chunk({ filePath, chunkIndex: 0 });
const duration = Date.now() - start;

console.log(`Operation took ${duration}ms`);

// Cache miss: > 200ms
// Cache hit: < 20ms
```

**Solutions:**

```typescript
// ✅ Use cache effectively
// Group operations on same file
const file = "/var/log/app.log";
const structure = await get_file_structure({ filePath: file });
const chunk = await read_large_file_chunk({ filePath: file, chunkIndex: 0 });
const search = await search_in_large_file({ filePath: file, pattern: "ERROR" });

// ✅ Limit search results
const results = await search_in_large_file({
  filePath: file,
  pattern: "ERROR",
  maxResults: 100 // Don't scan entire file
});

// ✅ Use appropriate chunk sizes
// For large files, use larger chunks
const stream = stream_large_file({
  filePath: largeFile,
  chunkSize: 5000 // Larger chunks = better throughput
});

// ✅ Simplify regex patterns
// BAD: Complex pattern
const results = await search_in_large_file({
  pattern: "(?=.*ERROR)(?=.*database)(?=.*timeout)",
  regex: true
});

// GOOD: Simple pattern
const results = await search_in_large_file({
  pattern: "ERROR.*database.*timeout",
  regex: true
});
```

### Invalid Chunk Index

**Error:**
```json
{
  "error": "Chunk index 10 exceeds total chunks (5)",
  "code": "INVALID_CHUNK_INDEX"
}
```

**Causes:**
1. Chunk index out of bounds
2. File changed since structure was read
3. Incorrect total chunks calculation

**Solutions:**

```typescript
// ✅ Get structure first
const structure = await get_file_structure({ filePath });

// ✅ Validate chunk index
if (chunkIndex >= structure.totalChunks) {
  console.error("Chunk index out of bounds");
} else {
  const chunk = await read_large_file_chunk({ filePath, chunkIndex });
}

// ✅ Safe iteration
for (let i = 0; i < structure.totalChunks; i++) {
  const chunk = await read_large_file_chunk({
    filePath,
    chunkIndex: i
  });
}
```

### Search Returns No Results

**Symptoms:**
- Expected matches not found
- Empty results array
- Pattern should match but doesn't

**Diagnosis:**

```typescript
// Test pattern on sample
const sample = "ERROR: Database connection failed";
const pattern = "ERROR.*database";

if (new RegExp(pattern, "i").test(sample)) {
  console.log("Pattern matches sample");
} else {
  console.log("Pattern doesn't match");
}
```

**Solutions:**

```typescript
// ✅ Case-insensitive search
const results = await search_in_large_file({
  filePath: file,
  pattern: "error",
  regex: true,
  caseSensitive: false
});

// ✅ Escape special characters
const searchTerm = "error[123]"; // Literal brackets
const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const results = await search_in_large_file({
  filePath: file,
  pattern: escaped,
  regex: true
});

// ✅ Use literal search for exact match
const results = await search_in_large_file({
  filePath: file,
  pattern: "exact string",
  regex: false
});

// ✅ Check file content
const firstChunk = await read_large_file_chunk({
  filePath: file,
  chunkIndex: 0
});
console.log("Sample content:", firstChunk.content.substring(0, 500));
```

### Line Numbers Don't Match

**Symptoms:**
- Navigate to line shows wrong content
- Line numbers inconsistent
- Off-by-one errors

**Causes:**
1. Line numbers are 1-based (not 0-based)
2. File modified during operation
3. Empty lines counted differently

**Solutions:**

```typescript
// ✅ Line numbers are 1-based
await navigate_to_line({
  filePath: file,
  lineNumber: 1 // First line is 1, not 0
});

// ✅ Get fresh structure if file changed
const structure = await get_file_structure({ filePath: file });
console.log(`Total lines: ${structure.totalLines}`);

// ✅ Validate line number
if (lineNumber > 0 && lineNumber <= structure.totalLines) {
  await navigate_to_line({ filePath: file, lineNumber });
} else {
  console.error("Invalid line number");
}
```

### Encoding Issues

**Symptoms:**
- Strange characters in output
- Garbled text
- Characters appearing as �

**Causes:**
1. Non-UTF-8 encoding
2. Binary file content
3. Mixed encodings

**Solutions:**

```typescript
// ✅ Check file encoding
const structure = await get_file_structure({ filePath: file });
console.log("Detected encoding:", structure.encoding);

// ✅ Skip binary files
if (structure.encoding !== "utf8") {
  console.warn("Non-UTF-8 file detected");
}

// ✅ For CSV: specify encoding
const fs = require("fs");
const content = fs.readFileSync(file, { encoding: "latin1" });
```

## Performance Issues

### Cache Thrashing

**Symptoms:**
- Low cache hit rate (< 60%)
- Inconsistent performance
- Memory usage fluctuating

**Diagnosis:**

```typescript
// Track cache performance
let cacheHits = 0;
let total = 0;

async function monitoredRead(filePath: string, chunkIndex: number) {
  total++;
  const start = Date.now();
  const result = await read_large_file_chunk({ filePath, chunkIndex });
  const duration = Date.now() - start;

  if (duration < 20) cacheHits++;

  console.log(`Hit rate: ${((cacheHits / total) * 100).toFixed(1)}%`);

  return result;
}
```

**Solutions:**

```typescript
// ✅ Group operations by file
const files = ["file1.log", "file2.log", "file3.log"];

// GOOD: Process one file completely
for (const file of files) {
  await analyzeFile(file);
}

// BAD: Interleave operations
for (let i = 0; i < 100; i++) {
  await read_large_file_chunk({ filePath: files[i % 3], chunkIndex: i });
  // Constant cache eviction
}

// ✅ Use sequential access
for (let i = 0; i < totalChunks; i++) {
  await read_large_file_chunk({ filePath: file, chunkIndex: i });
}

// BAD: Random access
const random = [5, 2, 8, 1, 9, 3]; // Random order
for (const index of random) {
  await read_large_file_chunk({ filePath: file, chunkIndex: index });
}
```

### High Memory Usage

**Diagnosis:**

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + "MB",
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + "MB"
  });
}, 5000);
```

**Solutions:**

```typescript
// ✅ Use streaming for large files
const stream = stream_large_file({
  filePath: largeFile,
  chunkSize: 1000
});

for await (const chunk of stream) {
  await processChunk(chunk);
  // Automatic garbage collection
}

// ✅ Process in batches
const batchSize = 10;
for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);
  await Promise.all(batch.map(f => processFile(f)));

  // Force garbage collection (if enabled)
  if (global.gc) global.gc();
}

// ✅ Release references
let data = await read_large_file_chunk({ filePath: file, chunkIndex: 0 });
processData(data);
data = null; // Release reference
```

### Slow Search

**Diagnosis:**

```typescript
// Time search operation
const start = Date.now();
const results = await search_in_large_file({
  filePath: file,
  pattern: complexPattern,
  regex: true
});
console.log(`Search took ${Date.now() - start}ms`);
```

**Solutions:**

```typescript
// ✅ Limit results
const results = await search_in_large_file({
  filePath: file,
  pattern: "ERROR",
  maxResults: 50 // Stop after 50 matches
});

// ✅ Use literal search when possible
// SLOW: Regex
const results = await search_in_large_file({
  pattern: "ERROR",
  regex: true
});

// FAST: Literal
const results = await search_in_large_file({
  pattern: "ERROR",
  regex: false
});

// ✅ Simplify regex
// SLOW: Complex lookahead
const pattern = "(?=.*ERROR)(?=.*database)(?=.*timeout)";

// FAST: Simple pattern
const pattern = "ERROR.*database.*timeout";

// ✅ Search specific section
// Get structure first
const structure = await get_file_structure({ filePath: file });

// Read relevant chunk
const chunk = await read_large_file_chunk({
  filePath: file,
  chunkIndex: Math.floor(estimatedLine / structure.chunkSize)
});

// Search in chunk
const matches = chunk.content
  .split("\n")
  .filter(line => line.includes("ERROR"));
```

## Integration Issues

### MCP Server Not Responding

**Symptoms:**
- Timeouts
- No response
- Connection errors

**Solutions:**

```typescript
// ✅ Add timeout handling
const timeout = 30000; // 30 seconds

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Operation timeout")), timeout)
);

try {
  const result = await Promise.race([
    read_large_file_chunk({ filePath: file, chunkIndex: 0 }),
    timeoutPromise
  ]);
} catch (error) {
  console.error("Operation timed out or failed:", error);
}

// ✅ Retry logic
async function readWithRetry(filePath: string, chunkIndex: number, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await read_large_file_chunk({ filePath, chunkIndex });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### Type Errors (TypeScript)

**Symptoms:**
- Type mismatch errors
- Undefined properties
- Type assertions needed

**Solutions:**

```typescript
// ✅ Use proper types
interface FileChunk {
  content: string;
  chunkIndex: number;
  totalChunks: number;
  startLine: number;
  endLine: number;
  fileSize: number;
  hasMore: boolean;
  chunkSize: number;
}

const chunk: FileChunk = await read_large_file_chunk({
  filePath: file,
  chunkIndex: 0
});

// ✅ Validate response structure
if (!chunk || typeof chunk.content !== "string") {
  throw new Error("Invalid response structure");
}

// ✅ Handle optional fields
const lineNumbers = chunk.includeLineNumbers ?? false;
```

## Best Practices for Debugging

### Enable Verbose Logging

```typescript
// Log all operations
async function loggedRead(filePath: string, chunkIndex: number) {
  console.log(`[READ] ${filePath} chunk ${chunkIndex}`);
  const start = Date.now();

  try {
    const result = await read_large_file_chunk({ filePath, chunkIndex });
    const duration = Date.now() - start;
    console.log(`[READ] Success in ${duration}ms (cache: ${duration < 20})`);
    return result;
  } catch (error) {
    console.error(`[READ] Failed:`, error);
    throw error;
  }
}
```

### Validate Inputs

```typescript
async function safeRead(filePath: string, chunkIndex: number) {
  // Validate file path
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Invalid file path");
  }

  // Validate chunk index
  if (typeof chunkIndex !== "number" || chunkIndex < 0) {
    throw new Error("Invalid chunk index");
  }

  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Get structure and validate
  const structure = await get_file_structure({ filePath });

  if (chunkIndex >= structure.totalChunks) {
    throw new Error(
      `Chunk index ${chunkIndex} exceeds total chunks ${structure.totalChunks}`
    );
  }

  return await read_large_file_chunk({ filePath, chunkIndex });
}
```

### Monitor Performance

```typescript
class PerformanceMonitor {
  private operations: Array<{ operation: string; duration: number; timestamp: Date }> = [];

  async monitor<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      this.operations.push({
        operation,
        duration,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      console.error(`Operation "${operation}" failed:`, error);
      throw error;
    }
  }

  getStats() {
    const durations = this.operations.map(op => op.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    return {
      totalOperations: this.operations.length,
      avgDuration: avg.toFixed(2) + "ms",
      maxDuration: max + "ms",
      minDuration: min + "ms"
    };
  }
}

// Usage
const monitor = new PerformanceMonitor();

await monitor.monitor("read_chunk", () =>
  read_large_file_chunk({ filePath: file, chunkIndex: 0 })
);

console.log(monitor.getStats());
```

## Getting Help

If issues persist:

1. **Check Documentation**: Review API reference and examples
2. **Search Issues**: Check GitHub issues for similar problems
3. **Create Issue**: Open new issue with:
   - Error message
   - Code sample
   - File size and type
   - Environment details (OS, Node version)

## See Also

- [Best Practices](/guide/best-practices) - Recommended patterns
- [Performance Guide](/guide/performance) - Optimization tips
- [Caching](/guide/caching) - Cache optimization
- [API Reference](/api/reference) - Complete API documentation
