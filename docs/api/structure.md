# get_file_structure

Analyze file structure and retrieve comprehensive metadata and statistics.

## Overview

The `get_file_structure` tool provides detailed information about a file's structure, including line count, size, encoding, and statistical analysis. This is essential for understanding file characteristics before processing.

## Usage

```json
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/large-dataset.csv"
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | Yes | - | Absolute or relative path to the file |

## Response Format

```typescript
{
  filePath: string;          // Absolute path to file
  fileName: string;          // File name without path
  fileSize: number;          // Size in bytes
  totalLines: number;        // Total line count
  encoding: string;          // Detected encoding (e.g., 'utf8')
  detectedType: string;      // File type (e.g., 'log', 'csv', 'json')
  chunkSize: number;         // Recommended lines per chunk
  totalChunks: number;       // Total number of chunks
  created: Date;             // File creation date
  modified: Date;            // Last modified date
  statistics: {
    avgLineLength: number;   // Average characters per line
    maxLineLength: number;   // Longest line length
    minLineLength: number;   // Shortest line length
    emptyLines: number;      // Count of empty lines
  };
}
```

## Examples

### Basic File Analysis

Analyze a log file:

```json
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/var/log/system.log"
  }
}
```

Response:
```json
{
  "filePath": "/var/log/system.log",
  "fileName": "system.log",
  "fileSize": 10485760,
  "totalLines": 25000,
  "encoding": "utf8",
  "detectedType": "log",
  "chunkSize": 500,
  "totalChunks": 50,
  "created": "2024-01-01T00:00:00.000Z",
  "modified": "2024-01-10T15:30:00.000Z",
  "statistics": {
    "avgLineLength": 120,
    "maxLineLength": 512,
    "minLineLength": 45,
    "emptyLines": 150
  }
}
```

### CSV File Structure

Analyze a CSV dataset:

```json
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/transactions.csv"
  }
}
```

Response:
```json
{
  "filePath": "/data/transactions.csv",
  "fileName": "transactions.csv",
  "fileSize": 52428800,
  "totalLines": 500000,
  "encoding": "utf8",
  "detectedType": "csv",
  "chunkSize": 1000,
  "totalChunks": 500,
  "created": "2024-01-05T08:00:00.000Z",
  "modified": "2024-01-10T14:00:00.000Z",
  "statistics": {
    "avgLineLength": 105,
    "maxLineLength": 250,
    "minLineLength": 95,
    "emptyLines": 0
  }
}
```

### Code File Analysis

Analyze a TypeScript file:

```json
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/code/app.ts"
  }
}
```

Response:
```json
{
  "filePath": "/code/app.ts",
  "fileName": "app.ts",
  "fileSize": 65536,
  "totalLines": 1250,
  "encoding": "utf8",
  "detectedType": "code",
  "chunkSize": 300,
  "totalChunks": 5,
  "created": "2024-01-01T10:00:00.000Z",
  "modified": "2024-01-10T16:45:00.000Z",
  "statistics": {
    "avgLineLength": 52,
    "maxLineLength": 180,
    "minLineLength": 0,
    "emptyLines": 85
  }
}
```

## File Type Detection

The tool automatically detects file type based on extension:

| Extension | Detected Type | Chunk Size | Typical Use Case |
|-----------|--------------|------------|------------------|
| .txt | text | 500 | Plain text files |
| .log | log | 500 | Application logs |
| .csv | csv | 1000 | Data exports |
| .json | json | 100 | Configuration, API data |
| .xml | xml | 200 | Structured data |
| .md | markdown | 500 | Documentation |
| .ts, .js, .py, .java | code | 300 | Source code |
| .yml, .yaml | config | 300 | Configuration |
| .sql | sql | 300 | Database scripts |
| .sh, .bash | shell | 300 | Shell scripts |

## Use Cases

### 1. Pre-Processing Assessment

Determine optimal processing strategy:

```typescript
const structure = await get_file_structure({
  filePath: "/data/large.csv"
});

if (structure.fileSize > 100_000_000) {
  // Use streaming approach
  console.log("Large file detected, using streaming");
} else {
  // Can load into memory
  console.log("Small file, loading directly");
}

console.log(`Will process in ${structure.totalChunks} chunks`);
```

### 2. Resource Planning

Calculate processing time and memory requirements:

```typescript
const structure = await get_file_structure({
  filePath: "/logs/app.log"
});

const estimatedMemory = structure.statistics.avgLineLength * structure.chunkSize;
const estimatedTime = structure.totalChunks * 100; // 100ms per chunk

console.log(`Memory per chunk: ${estimatedMemory} bytes`);
console.log(`Estimated processing time: ${estimatedTime}ms`);
```

### 3. Data Quality Check

Identify potential issues:

```typescript
const structure = await get_file_structure({
  filePath: "/data/import.csv"
});

// Check for unusual line lengths
if (structure.statistics.maxLineLength > 10000) {
  console.warn("Unusually long lines detected");
}

// Check for empty lines
const emptyLinePercent =
  (structure.statistics.emptyLines / structure.totalLines) * 100;

if (emptyLinePercent > 10) {
  console.warn(`${emptyLinePercent}% empty lines`);
}
```

### 4. File Comparison

Compare multiple files:

```typescript
const file1 = await get_file_structure({
  filePath: "/data/old.csv"
});

const file2 = await get_file_structure({
  filePath: "/data/new.csv"
});

console.log(`Line difference: ${file2.totalLines - file1.totalLines}`);
console.log(`Size difference: ${file2.fileSize - file1.fileSize} bytes`);
```

### 5. Archive Decision

Determine if file should be archived:

```typescript
const structure = await get_file_structure({
  filePath: "/logs/old.log"
});

const daysSinceModified =
  (Date.now() - structure.modified.getTime()) / (1000 * 60 * 60 * 24);

if (daysSinceModified > 30 && structure.fileSize > 10_000_000) {
  console.log("Consider archiving this file");
}
```

## Statistics Interpretation

### Average Line Length

Indicates file structure:
- **< 50 chars**: Likely structured data or code
- **50-200 chars**: Normal text/logs
- **> 200 chars**: Verbose logs or JSON

### Max Line Length

Warns about potential issues:
- **> 1000 chars**: May cause performance issues
- **> 10000 chars**: Consider pre-processing

### Empty Lines

Indicates formatting:
- **0%**: Dense data files (CSV, JSON)
- **5-10%**: Normal code/text
- **> 20%**: Sparse formatting or issues

## Performance

| File Size | Analysis Time | Memory Usage | Notes |
|-----------|--------------|--------------|-------|
| < 1MB | < 50ms | Minimal | Full scan |
| 1-10MB | 50-200ms | < 10MB | Streaming |
| 10-100MB | 200-1000ms | < 50MB | Line counting |
| 100MB-1GB | 1-5s | < 100MB | Optimized scan |
| > 1GB | 5-30s | < 200MB | Progressive |

## Error Handling

### File Not Found

```json
{
  "error": "File not found: /path/to/file.csv",
  "code": "ENOENT"
}
```

### Permission Denied

```json
{
  "error": "Permission denied: /root/protected.log",
  "code": "EACCES"
}
```

### Unsupported File Type

```json
{
  "error": "Binary file not supported: /data/image.png",
  "code": "UNSUPPORTED_TYPE"
}
```

## Best Practices

### 1. Always Analyze Before Processing

Check file structure before heavy operations:

```typescript
// Good: Analyze first
const structure = await get_file_structure({ filePath });
console.log(`Processing ${structure.totalChunks} chunks`);

// Then process
for (let i = 0; i < structure.totalChunks; i++) {
  await process_chunk(filePath, i);
}
```

### 2. Cache Structure Information

Structure rarely changes, cache it:

```typescript
const structureCache = new Map();

async function getStructureCached(filePath) {
  if (!structureCache.has(filePath)) {
    const structure = await get_file_structure({ filePath });
    structureCache.set(filePath, structure);
  }
  return structureCache.get(filePath);
}
```

### 3. Validate File Size

Check size before processing:

```typescript
const structure = await get_file_structure({ filePath });

if (structure.fileSize > MAX_FILE_SIZE) {
  throw new Error(`File too large: ${structure.fileSize} bytes`);
}
```

### 4. Use Statistics for Optimization

Adapt chunk size based on line length:

```typescript
const structure = await get_file_structure({ filePath });

const optimalChunkSize = structure.statistics.avgLineLength < 100
  ? 1000  // Small lines, larger chunks
  : 300;  // Large lines, smaller chunks
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [read_large_file_chunk](/api/read-chunk) - Read file chunks
- [search_in_large_file](/api/search) - Search within files
- [get_file_summary](/api/summary) - Quick file overview
- [Performance Guide](/guide/performance) - Optimization tips
- [Best Practices](/guide/best-practices) - Usage recommendations
