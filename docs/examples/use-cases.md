# Use Cases

## Log File Analysis

Analyze large log files to find errors, warnings, and patterns.

### Find All Errors

```typescript
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/application.log",
    "pattern": "ERROR",
    "contextBefore": 3,
    "contextAfter": 3,
    "maxResults": 50
  }
}
```

### Regex Pattern Matching

```typescript
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/nginx/access.log",
    "pattern": "^\\[\\d{4}-\\d{2}-\\d{2}.*\\] 5\\d{2}",
    "regex": true
  }
}
```

## Code Navigation

Navigate large codebases efficiently.

### Jump to Function Definition

```typescript
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/project/src/main.py",
    "pattern": "^def process_data\\(",
    "regex": true,
    "contextAfter": 20
  }
}
```

### Navigate to Specific Line

```typescript
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/project/src/app.ts",
    "lineNumber": 1234,
    "contextLines": 15
  }
}
```

## CSV Data Analysis

Work with large CSV files without loading them entirely.

### Analyze CSV Structure

```typescript
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/sales_2024.csv"
  }
}
```

### Read CSV Chunks

```typescript
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/data/sales_2024.csv",
    "chunkIndex": 0,
    "linesPerChunk": 1000
  }
}
```

## Processing Very Large Files

Stream very large files efficiently.

### Stream Large Dataset

```typescript
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/large_dataset.json",
    "chunkSize": 65536,
    "maxChunks": 20
  }
}
```

## Best Practices

1. **Use appropriate chunk sizes** for your file type
2. **Enable caching** for frequently accessed files
3. **Use streaming** for files > 1GB
4. **Limit search results** with `maxResults` to avoid overwhelming output
5. **Use contextLines** to get enough surrounding code/text
