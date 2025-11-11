# get_file_summary

Get a quick summary of file metadata and basic statistics.

## Overview

The `get_file_summary` tool provides a concise overview of file characteristics without the detailed analysis of `get_file_structure`. It's optimized for speed and gives you essential information quickly.

## Usage

```json
{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/var/log/app.log"
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
  filePath: string;       // Absolute path to file
  fileName: string;       // File name without path
  fileSize: number;       // Size in bytes
  fileSizeFormatted: string; // Human-readable size (e.g., "10.5 MB")
  totalLines: number;     // Total line count
  created: Date;          // File creation date
  modified: Date;         // Last modified date
  accessed: Date;         // Last accessed date
  isReadable: boolean;    // Whether file is readable
  isWritable: boolean;    // Whether file is writable
}
```

## Examples

### Basic Summary

Quick file overview:

```json
{
  "tool": "get_file_summary",
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
  "fileSizeFormatted": "10 MB",
  "totalLines": 25000,
  "created": "2024-01-01T00:00:00.000Z",
  "modified": "2024-01-10T15:30:00.000Z",
  "accessed": "2024-01-10T16:00:00.000Z",
  "isReadable": true,
  "isWritable": false
}
```

### CSV File Summary

```json
{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/data/sales.csv"
  }
}
```

Response:
```json
{
  "filePath": "/data/sales.csv",
  "fileName": "sales.csv",
  "fileSize": 52428800,
  "fileSizeFormatted": "50 MB",
  "totalLines": 500000,
  "created": "2024-01-05T08:00:00.000Z",
  "modified": "2024-01-09T23:45:00.000Z",
  "accessed": "2024-01-10T09:15:00.000Z",
  "isReadable": true,
  "isWritable": true
}
```

### Code File Summary

```json
{
  "tool": "get_file_summary",
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
  "fileSizeFormatted": "64 KB",
  "totalLines": 1250,
  "created": "2024-01-01T10:00:00.000Z",
  "modified": "2024-01-10T16:45:00.000Z",
  "accessed": "2024-01-10T16:50:00.000Z",
  "isReadable": true,
  "isWritable": true
}
```

## Comparison: Summary vs Structure

| Feature | get_file_summary | get_file_structure |
|---------|------------------|-------------------|
| Speed | Fast (< 100ms) | Slower (200ms-5s) |
| File size | ✅ | ✅ |
| Line count | ✅ | ✅ |
| Timestamps | ✅ | ✅ |
| Permissions | ✅ | ❌ |
| File type detection | ❌ | ✅ |
| Chunk information | ❌ | ✅ |
| Statistics | ❌ | ✅ (detailed) |
| Encoding detection | ❌ | ✅ |

**Use `get_file_summary` when:**
- You need quick file information
- You're doing permission checks
- You're building file listings
- You need human-readable sizes

**Use `get_file_structure` when:**
- You need detailed statistics
- You're planning file processing
- You need chunk information
- You need encoding detection

## Common Use Cases

### 1. File Listing

Build file browser interface:

```typescript
async function listFiles(directory: string) {
  const files = await readdir(directory);
  const summaries = await Promise.all(
    files.map(file =>
      get_file_summary({
        filePath: path.join(directory, file)
      })
    )
  );
  return summaries.sort((a, b) => b.modified - a.modified);
}
```

### 2. Permission Check

Verify file accessibility before operations:

```typescript
const summary = await get_file_summary({
  filePath: "/data/important.csv"
});

if (!summary.isReadable) {
  throw new Error("Cannot read file: permission denied");
}

if (!summary.isWritable) {
  console.warn("File is read-only");
}
```

### 3. File Age Check

Find old files for archival:

```typescript
const summary = await get_file_summary({
  filePath: "/logs/old.log"
});

const daysSinceModified =
  (Date.now() - summary.modified.getTime()) / (1000 * 60 * 60 * 24);

if (daysSinceModified > 30) {
  console.log(`Archive candidate: ${summary.fileName}`);
}
```

### 4. Size-Based Processing

Choose processing strategy based on size:

```typescript
const summary = await get_file_summary({
  filePath: "/data/dataset.csv"
});

if (summary.fileSize < 1_000_000) {
  // Process in memory
  console.log("Small file, loading directly");
} else if (summary.fileSize < 100_000_000) {
  // Stream processing
  console.log("Medium file, using streaming");
} else {
  // Distributed processing
  console.log("Large file, using distributed processing");
}
```

### 5. Recent Files

Show recently modified files:

```typescript
async function getRecentFiles(directory: string, days: number = 7) {
  const files = await readdir(directory);
  const summaries = await Promise.all(
    files.map(f => get_file_summary({ filePath: path.join(directory, f) }))
  );

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return summaries
    .filter(s => s.modified.getTime() > cutoff)
    .sort((a, b) => b.modified.getTime() - a.modified.getTime());
}
```

## Performance

| File Size | Summary Time | Notes |
|-----------|--------------|-------|
| < 1MB | < 20ms | Stat + quick line count |
| 1-10MB | 20-50ms | Streaming line count |
| 10-100MB | 50-200ms | Optimized counting |
| 100MB-1GB | 200-1000ms | Line-by-line count |
| > 1GB | 1-5s | Progressive counting |

### Performance Tips

1. **Cache Results**: File metadata rarely changes
2. **Batch Operations**: Use Promise.all for multiple files
3. **Skip Line Count**: If not needed, use `fs.stat` directly
4. **Use Indexes**: Build file index for large directories

## Error Handling

### File Not Found

```json
{
  "error": "File not found: /path/to/missing.log",
  "code": "ENOENT"
}
```

### Permission Denied

```json
{
  "filePath": "/root/protected.log",
  "fileName": "protected.log",
  "isReadable": false,
  "isWritable": false,
  "error": "Permission denied"
}
```

### Symbolic Link

```json
{
  "filePath": "/var/log/current.log",
  "fileName": "current.log",
  "isSymlink": true,
  "linkTarget": "/var/log/2024-01-10.log"
}
```

## Human-Readable Sizes

The `fileSizeFormatted` field uses the following format:

| Size Range | Format | Example |
|------------|--------|---------|
| < 1 KB | Bytes | "512 bytes" |
| 1 KB - 1 MB | KB | "128 KB" |
| 1 MB - 1 GB | MB | "45.5 MB" |
| 1 GB - 1 TB | GB | "2.3 GB" |
| >= 1 TB | TB | "1.5 TB" |

## Best Practices

### 1. Quick Checks

Use for fast validation:

```typescript
// Quick check before processing
const summary = await get_file_summary({ filePath });

if (summary.fileSize === 0) {
  throw new Error("File is empty");
}

if (!summary.isReadable) {
  throw new Error("Cannot read file");
}
```

### 2. File Browser

Build responsive file browsers:

```typescript
// Fast initial load
const summaries = await Promise.all(
  files.map(f => get_file_summary({ filePath: f }))
);

// Display in UI
summaries.forEach(s => {
  console.log(`${s.fileName} - ${s.fileSizeFormatted} - ${s.modified}`);
});
```

### 3. Caching

Cache summary data:

```typescript
const cache = new Map<string, FileSummary>();

async function getSummaryCached(filePath: string) {
  const summary = await get_file_summary({ filePath });

  // Cache if file hasn't changed
  const cached = cache.get(filePath);
  if (cached && cached.modified.getTime() === summary.modified.getTime()) {
    return cached;
  }

  cache.set(filePath, summary);
  return summary;
}
```

### 4. Batch Processing

Process multiple files efficiently:

```typescript
async function summarizeDirectory(dir: string) {
  const files = await readdir(dir);

  // Batch process
  const summaries = await Promise.all(
    files.map(f =>
      get_file_summary({
        filePath: path.join(dir, f)
      })
    )
  );

  return summaries;
}
```

## Integration Examples

### File Dashboard

```typescript
interface FileDashboard {
  totalFiles: number;
  totalSize: number;
  oldestFile: Date;
  newestFile: Date;
  largestFile: string;
  files: FileSummary[];
}

async function createDashboard(directory: string): Promise<FileDashboard> {
  const files = await readdir(directory);
  const summaries = await Promise.all(
    files.map(f => get_file_summary({ filePath: path.join(directory, f) }))
  );

  return {
    totalFiles: summaries.length,
    totalSize: summaries.reduce((sum, s) => sum + s.fileSize, 0),
    oldestFile: new Date(Math.min(...summaries.map(s => s.created.getTime()))),
    newestFile: new Date(Math.max(...summaries.map(s => s.modified.getTime()))),
    largestFile: summaries.reduce((max, s) =>
      s.fileSize > max.fileSize ? s : max
    ).fileName,
    files: summaries
  };
}
```

### Watch File Changes

```typescript
class FileWatcher {
  private lastSummary: FileSummary;

  async hasChanged(filePath: string): Promise<boolean> {
    const current = await get_file_summary({ filePath });

    if (!this.lastSummary) {
      this.lastSummary = current;
      return false;
    }

    const changed =
      current.modified.getTime() !== this.lastSummary.modified.getTime() ||
      current.fileSize !== this.lastSummary.fileSize;

    this.lastSummary = current;
    return changed;
  }
}
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [get_file_structure](/api/structure) - Detailed file analysis
- [read_large_file_chunk](/api/read-chunk) - Read file chunks
- [Best Practices](/guide/best-practices) - Usage recommendations
- [Performance Guide](/guide/performance) - Optimization tips
