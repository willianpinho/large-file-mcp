# read_large_file_chunk

Read a specific chunk of a large file with intelligent chunking and optional line numbering.

## Overview

The `read_large_file_chunk` tool is the core method for reading large files in manageable chunks. It automatically determines optimal chunk size based on file type and provides flexible navigation through file content.

## Usage

```json
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/path/to/file.log",
    "chunkIndex": 0,
    "includeLineNumbers": true
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | Yes | - | Absolute or relative path to the file |
| `chunkIndex` | number | No | 0 | Zero-based index of the chunk to read |
| `includeLineNumbers` | boolean | No | false | Whether to prepend line numbers to each line |

## Response Format

```typescript
{
  content: string;           // The chunk content
  chunkIndex: number;        // Current chunk index
  totalChunks: number;       // Total number of chunks
  startLine: number;         // First line number in chunk
  endLine: number;           // Last line number in chunk
  fileSize: number;          // Total file size in bytes
  hasMore: boolean;          // Whether more chunks exist
  chunkSize: number;         // Lines per chunk
}
```

## Automatic Chunk Sizing

The tool intelligently determines chunk size based on file extension:

| File Type | Extension | Lines per Chunk |
|-----------|-----------|-----------------|
| Text files | .txt | 500 |
| Log files | .log | 500 |
| Code files | .ts, .js, .py, .java, etc. | 300 |
| CSV files | .csv | 1000 |
| JSON files | .json | 100 |
| XML files | .xml | 200 |
| Markdown | .md | 500 |
| Config files | .yml, .yaml, .sh | 300 |
| Default | other | 500 |

## Examples

### Basic Usage

Read the first chunk of a log file:

```json
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/var/log/system.log",
    "chunkIndex": 0
  }
}
```

Response:
```json
{
  "content": "2024-01-10 10:00:00 INFO Server started\n2024-01-10 10:00:01 INFO Loading configuration...",
  "chunkIndex": 0,
  "totalChunks": 5,
  "startLine": 1,
  "endLine": 500,
  "fileSize": 1048576,
  "hasMore": true,
  "chunkSize": 500
}
```

### With Line Numbers

Read with line numbers for easier navigation:

```json
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/code/app.ts",
    "chunkIndex": 0,
    "includeLineNumbers": true
  }
}
```

Response:
```json
{
  "content": "1: import express from 'express';\n2: import { config } from './config';\n3: \n4: const app = express();",
  "chunkIndex": 0,
  "totalChunks": 2,
  "startLine": 1,
  "endLine": 300,
  "fileSize": 65536,
  "hasMore": true,
  "chunkSize": 300
}
```

### Navigate to Specific Chunk

Read chunk 3 of a large CSV file:

```json
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/data/transactions.csv",
    "chunkIndex": 3
  }
}
```

Response:
```json
{
  "content": "id,date,amount,status\n1234,2024-01-10,99.99,completed\n...",
  "chunkIndex": 3,
  "totalChunks": 10,
  "startLine": 3001,
  "endLine": 4000,
  "fileSize": 5242880,
  "hasMore": true,
  "chunkSize": 1000
}
```

## Performance

| File Size | Read Time | Cache Hit | Notes |
|-----------|-----------|-----------|-------|
| < 1MB | < 50ms | N/A | Direct read |
| 1-10MB | 50-100ms | 80% | LRU cache benefit |
| 10-100MB | 100-300ms | 85% | Streaming + cache |
| 100MB-1GB | 300-1000ms | 90% | Optimized streaming |
| > 1GB | Progressive | 90% | Chunk-by-chunk |

## Best Practices

### 1. Start with Chunk 0

Always start reading from chunk 0 to understand file structure:

```json
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/path/to/file",
    "chunkIndex": 0,
    "includeLineNumbers": true
  }
}
```

### 2. Check `hasMore` Flag

Use the `hasMore` flag to determine if more chunks exist:

```typescript
if (response.hasMore) {
  // Read next chunk
  const nextChunk = response.chunkIndex + 1;
}
```

### 3. Use Line Numbers for Navigation

Enable line numbers when you need to reference specific lines:

```json
{
  "includeLineNumbers": true
}
```

### 4. Calculate Total Lines

```typescript
const totalLines = response.totalChunks * response.chunkSize;
```

### 5. Handle Large Files Progressively

For files with many chunks, read progressively rather than all at once:

```typescript
// Good: Progressive reading
for (let i = 0; i < totalChunks; i++) {
  const chunk = await readChunk(filePath, i);
  processChunk(chunk);
}

// Bad: Loading all chunks
const allChunks = await Promise.all(
  Array.from({ length: totalChunks }, (_, i) => readChunk(filePath, i))
);
```

## Error Handling

### File Not Found

```json
{
  "error": "File not found: /path/to/nonexistent.log",
  "code": "ENOENT"
}
```

### Invalid Chunk Index

```json
{
  "error": "Chunk index 10 exceeds total chunks (5)",
  "code": "INVALID_CHUNK_INDEX"
}
```

### Permission Denied

```json
{
  "error": "Permission denied: /root/protected.log",
  "code": "EACCES"
}
```

## Caching Behavior

The tool uses LRU (Least Recently Used) caching with the following characteristics:

- **Cache Key**: `${filePath}:chunk:${chunkIndex}`
- **Max Size**: 100 chunks (configurable)
- **TTL**: No expiration (LRU eviction only)
- **Hit Rate**: 80-90% for typical workflows
- **Memory Overhead**: ~1MB per cached chunk (varies by chunk size)

### Cache Performance

```typescript
// First read: Cache miss
read_large_file_chunk(file, 0) // ~200ms

// Second read: Cache hit
read_large_file_chunk(file, 0) // ~5ms
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [search_in_large_file](/api/search) - Search within files
- [navigate_to_line](/api/navigate) - Jump to specific lines
- [get_file_summary](/api/summary) - File metadata and statistics
- [Performance Guide](/guide/performance) - Optimization tips
- [Caching Guide](/guide/caching) - Cache configuration
