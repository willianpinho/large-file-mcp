# Usage Examples for Large File MCP Server

## Example 1: Analyzing Large Log Files

### Scenario: Application Log Analysis

You have a 2GB application log file and need to find all errors related to database connections.

```json
// Step 1: Get file structure
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/var/log/app/application.log"
  }
}

// Response shows: 5,000,000 lines, recommended chunk size: 500 lines

// Step 2: Search for database errors
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/app/application.log",
    "pattern": "(ERROR|FATAL).*database",
    "regex": true,
    "maxResults": 100,
    "contextBefore": 3,
    "contextAfter": 3
  }
}

// Step 3: Navigate to specific error for detailed context
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/var/log/app/application.log",
    "lineNumber": 2543891,
    "contextLines": 20
  }
}
```

## Example 2: Processing Large CSV Datasets

### Scenario: Sales Data Analysis

You have a 5GB CSV file with 50 million rows of sales data.

```json
// Step 1: Analyze file structure
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/sales/2024_sales.csv"
  }
}

// Step 2: Read header and first chunk
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/data/sales/2024_sales.csv",
    "chunkIndex": 0,
    "linesPerChunk": 1000,
    "includeLineNumbers": true
  }
}

// Step 3: Search for specific product
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/data/sales/2024_sales.csv",
    "pattern": "PROD-12345",
    "caseSensitive": true,
    "maxResults": 1000
  }
}

// Step 4: Stream entire file for processing
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/sales/2024_sales.csv",
    "chunkSize": 1048576,
    "maxChunks": 50
  }
}
```

## Example 3: Code Navigation in Large Codebases

### Scenario: Finding Function Definitions

You have a large TypeScript codebase with files over 10,000 lines.

```json
// Step 1: Get file summary
{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/project/src/core/engine.ts"
  }
}

// Step 2: Search for all function definitions
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/project/src/core/engine.ts",
    "pattern": "^\\s*(export\\s+)?(async\\s+)?function\\s+\\w+",
    "regex": true,
    "maxResults": 500,
    "contextBefore": 1,
    "contextAfter": 5
  }
}

// Step 3: Navigate to specific function
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/project/src/core/engine.ts",
    "lineNumber": 3456,
    "contextLines": 30
  }
}

// Step 4: Search for TODOs and FIXMEs
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/project/src/core/engine.ts",
    "pattern": "TODO|FIXME|HACK|XXX",
    "regex": true,
    "contextBefore": 2,
    "contextAfter": 2
  }
}
```

## Example 4: JSON Data Processing

### Scenario: Large JSON Array Processing

You have a 3GB JSON file with a large array of objects.

```json
// Step 1: Check file structure
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/api_responses.json"
  }
}

// Step 2: Read in small chunks (JSON has long lines)
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/data/api_responses.json",
    "chunkIndex": 0,
    "linesPerChunk": 100
  }
}

// Step 3: Search for specific JSON keys
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/data/api_responses.json",
    "pattern": "\"userId\":\\s*\"user-12345\"",
    "regex": true,
    "contextBefore": 5,
    "contextAfter": 10
  }
}

// Step 4: Stream for complete processing
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/api_responses.json",
    "chunkSize": 524288,
    "maxChunks": 20
  }
}
```

## Example 5: System Log Monitoring

### Scenario: Real-time Error Detection

Monitor recent entries in a constantly growing log file.

```json
// Step 1: Get file metadata
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/var/log/syslog"
  }
}

// Response: totalLines: 125000

// Step 2: Read last chunk (most recent entries)
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/var/log/syslog",
    "chunkIndex": 249,  // (125000 / 500) - 1
    "includeLineNumbers": true
  }
}

// Step 3: Search for errors in recent entries only
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/syslog",
    "pattern": "error|critical|fatal",
    "regex": true,
    "caseSensitive": false,
    "startLine": 120000,
    "endLine": 125000,
    "contextBefore": 3,
    "contextAfter": 3
  }
}
```

## Example 6: Multi-File Analysis

### Scenario: Searching Across Multiple Log Files

Process multiple log files from different dates.

```json
// For each file, run structure analysis
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/logs/app-2024-01-01.log"
  }
}

{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/logs/app-2024-01-02.log"
  }
}

// Search each file for pattern
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/logs/app-2024-01-01.log",
    "pattern": "OutOfMemoryError",
    "maxResults": 50
  }
}

{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/logs/app-2024-01-02.log",
    "pattern": "OutOfMemoryError",
    "maxResults": 50
  }
}

// Get summary statistics for comparison
{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/logs/app-2024-01-01.log"
  }
}

{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/logs/app-2024-01-02.log"
  }
}
```

## Example 7: Performance-Optimized Large File Processing

### Scenario: Processing 10GB File Efficiently

```json
// Step 1: Analyze file to understand size
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/huge_dataset.txt"
  }
}

// Response: 200,000,000 lines, 10GB

// Step 2: Stream in large chunks for processing
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/huge_dataset.txt",
    "chunkSize": 10485760,  // 10MB chunks
    "maxChunks": 100,
    "startOffset": 0
  }
}

// Step 3: Continue from offset (for next batch)
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/huge_dataset.txt",
    "chunkSize": 10485760,
    "maxChunks": 100,
    "startOffset": 1048576000  // 1GB offset
  }
}

// Step 4: If looking for specific data, use targeted search
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/data/huge_dataset.txt",
    "pattern": "critical_marker",
    "maxResults": 10,
    "startLine": 1000000,
    "endLine": 2000000
  }
}
```

## Example 8: Code Review Workflow

### Scenario: Reviewing Large PR Changes

```json
// Step 1: Get file overview
{
  "tool": "get_file_summary",
  "arguments": {
    "filePath": "/project/src/components/Dashboard.tsx"
  }
}

// Step 2: Find all React components
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/project/src/components/Dashboard.tsx",
    "pattern": "^(export\\s+)?(const|function)\\s+\\w+.*=.*React",
    "regex": true,
    "contextBefore": 2,
    "contextAfter": 10
  }
}

// Step 3: Find all useEffect hooks
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/project/src/components/Dashboard.tsx",
    "pattern": "useEffect\\(",
    "contextBefore": 3,
    "contextAfter": 15
  }
}

// Step 4: Navigate to specific component
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/project/src/components/Dashboard.tsx",
    "lineNumber": 567,
    "contextLines": 25
  }
}
```

## Best Practices

### 1. Start with File Structure

Always begin by calling `get_file_structure` to understand:
- File size
- Total lines
- Recommended chunk size
- File type

### 2. Use Appropriate Chunk Sizes

- **Small files (<1000 lines)**: Use default or smaller chunks
- **Medium files (1K-100K lines)**: Use recommended chunk size
- **Large files (>100K lines)**: Use larger chunks or streaming

### 3. Optimize Search Queries

- Use `startLine` and `endLine` to limit search range
- Set reasonable `maxResults` to avoid overwhelming output
- Use `regex: false` for simple string searches (faster)
- Adjust `contextBefore` and `contextAfter` based on needs

### 4. Leverage Caching

- Enable caching for frequently accessed files
- Adjust `CACHE_SIZE` based on available memory
- Use appropriate `CACHE_TTL` for your use case

### 5. Handle Very Large Files

- Use `stream_large_file` for files >1GB
- Process in batches using `startOffset` and `maxBytes`
- Consider `maxChunks` to limit memory usage

### 6. Error Handling

Always check for errors in responses:
```json
{
  "error": "File not accessible: /path/to/file",
  "code": "TOOL_EXECUTION_ERROR"
}
```

## Performance Tips

1. **Cache Warm-up**: Read file structure first to warm cache
2. **Batch Operations**: Group related operations together
3. **Incremental Processing**: Use offsets for very large files
4. **Limit Results**: Use `maxResults` to prevent memory issues
5. **Context Balance**: Don't use excessive `contextBefore`/`contextAfter`
