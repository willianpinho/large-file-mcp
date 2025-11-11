# navigate_to_line

Jump to a specific line in a large file with configurable surrounding context.

## Overview

The `navigate_to_line` tool allows you to quickly jump to any line number in a file and retrieve surrounding context. This is particularly useful for debugging, code review, and following references from log files or error messages.

## Usage

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/app.ts",
    "lineNumber": 1234,
    "contextLines": 10
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | Yes | - | Absolute or relative path to the file |
| `lineNumber` | number | Yes | - | Line number to navigate to (1-based) |
| `contextLines` | number | No | 5 | Number of lines before and after target line |

## Response Format

```typescript
{
  lineNumber: number;        // Target line number
  content: string;           // Target line content
  contextBefore: string[];   // Lines before target
  contextAfter: string[];    // Lines after target
  startLine: number;         // First line in response
  endLine: number;           // Last line in response
  totalLines: number;        // Total lines in file
}
```

## Examples

### Basic Navigation

Jump to line 1234 with default context:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/app.ts",
    "lineNumber": 1234
  }
}
```

Response:
```json
{
  "lineNumber": 1234,
  "content": "  async function processData(input: string): Promise<Result> {",
  "contextBefore": [
    "  // Process user input",
    "  validateInput(input);",
    "  ",
    "  // Main processing function",
    "  "
  ],
  "contextAfter": [
    "    const cleaned = sanitize(input);",
    "    const result = await transform(cleaned);",
    "    return result;",
    "  }",
    ""
  ],
  "startLine": 1229,
  "endLine": 1239,
  "totalLines": 5000
}
```

### Extended Context

Navigate with more context for deeper understanding:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/var/log/error.log",
    "lineNumber": 5678,
    "contextLines": 20
  }
}
```

Response:
```json
{
  "lineNumber": 5678,
  "content": "ERROR: Database connection timeout after 30s",
  "contextBefore": [
    "INFO: Starting database connection pool",
    "INFO: Pool size: 10 connections",
    "...",
    "WARN: Connection attempt 1 failed",
    "WARN: Connection attempt 2 failed",
    "WARN: Connection attempt 3 failed"
  ],
  "contextAfter": [
    "ERROR: Rolling back transaction",
    "ERROR: Cleanup failed",
    "INFO: Attempting reconnection",
    "...",
    "INFO: Connection restored successfully"
  ],
  "startLine": 5658,
  "endLine": 5698,
  "totalLines": 100000
}
```

### Minimal Context

Quick peek at specific line:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/data/transactions.csv",
    "lineNumber": 12345,
    "contextLines": 0
  }
}
```

Response:
```json
{
  "lineNumber": 12345,
  "content": "TX-12345,2024-01-10,99.99,completed",
  "contextBefore": [],
  "contextAfter": [],
  "startLine": 12345,
  "endLine": 12345,
  "totalLines": 1000000
}
```

## Common Use Cases

### 1. Error Investigation

Follow stack trace to specific line:

```typescript
// Stack trace shows: "Error at app.ts:1234"
const context = await navigate_to_line({
  filePath: "/code/app.ts",
  lineNumber: 1234,
  contextLines: 15
});

console.log("Error context:", context.content);
console.log("Before error:", context.contextBefore.join("\n"));
console.log("After error:", context.contextAfter.join("\n"));
```

### 2. Code Review

Jump to specific function definition:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/server.ts",
    "lineNumber": 567,
    "contextLines": 25
  }
}
```

### 3. Log Analysis

Investigate error from log reference:

```typescript
// Log shows: "See line 9876 for details"
const details = await navigate_to_line({
  filePath: "/var/log/system.log",
  lineNumber: 9876,
  contextLines: 10
});
```

### 4. Data Inspection

Check specific record in large dataset:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/data/users.csv",
    "lineNumber": 54321,
    "contextLines": 3
  }
}
```

### 5. Configuration Verification

Verify specific config line:

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/etc/app/config.yml",
    "lineNumber": 42,
    "contextLines": 10
  }
}
```

## Performance

| File Size | Navigation Time | Method | Notes |
|-----------|----------------|--------|-------|
| < 1MB | < 50ms | Direct read | Full file in memory |
| 1-10MB | 50-200ms | Streaming | Line-by-line to target |
| 10-100MB | 200-500ms | Optimized stream | Skip to approximate position |
| 100MB-1GB | 500-2000ms | Binary search | Seek to offset |
| > 1GB | 1-5s | Indexed seek | Chunk-based navigation |

### Performance Optimization

The tool uses several optimizations:

1. **Binary Search**: For large files, approximates position based on average line length
2. **Streaming**: Reads only necessary lines, not entire file
3. **Caching**: Frequently accessed regions cached via LRU
4. **Early Exit**: Stops reading once context retrieved

## Edge Cases

### Line at Start of File

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/app.ts",
    "lineNumber": 5,
    "contextLines": 10
  }
}
```

Response:
```json
{
  "lineNumber": 5,
  "content": "import { config } from './config';",
  "contextBefore": [
    "import express from 'express';",
    "import { logger } from './logger';",
    "import { db } from './database';",
    ""
  ],
  "contextAfter": [
    "import { router } from './router';",
    "",
    "const app = express();",
    "...",
  ],
  "startLine": 1,
  "endLine": 15,
  "totalLines": 5000
}
```

### Line at End of File

```json
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/var/log/old.log",
    "lineNumber": 9995,
    "contextLines": 10
  }
}
```

Response:
```json
{
  "lineNumber": 9995,
  "content": "INFO: Server shutdown complete",
  "contextBefore": [
    "INFO: Closing database connections",
    "INFO: Flushing logs",
    "...",
    "INFO: Cleanup complete"
  ],
  "contextAfter": [
    "INFO: Final stats logged",
    "INFO: Exit code: 0"
  ],
  "startLine": 9985,
  "endLine": 9997,
  "totalLines": 9997
}
```

## Error Handling

### File Not Found

```json
{
  "error": "File not found: /path/to/file.ts",
  "code": "ENOENT"
}
```

### Invalid Line Number

```json
{
  "error": "Line number 10000 exceeds total lines (5000)",
  "code": "INVALID_LINE_NUMBER"
}
```

### Line Number Out of Range

```json
{
  "error": "Line number must be >= 1",
  "code": "INVALID_LINE_NUMBER"
}
```

### Permission Denied

```json
{
  "error": "Permission denied: /root/protected.ts",
  "code": "EACCES"
}
```

## Best Practices

### 1. Adjust Context Based on File Type

```typescript
// Code files: moderate context
const codeContext = await navigate_to_line({
  filePath: "app.ts",
  lineNumber: 500,
  contextLines: 15
});

// Log files: extensive context
const logContext = await navigate_to_line({
  filePath: "system.log",
  lineNumber: 5000,
  contextLines: 25
});

// Data files: minimal context
const dataContext = await navigate_to_line({
  filePath: "data.csv",
  lineNumber: 12345,
  contextLines: 3
});
```

### 2. Combine with Search

Find then navigate for detailed view:

```typescript
// Step 1: Find line with error
const searchResult = await search_in_large_file({
  filePath: "/var/log/app.log",
  pattern: "FATAL ERROR",
  maxResults: 1
});

// Step 2: Navigate to error with context
const errorContext = await navigate_to_line({
  filePath: "/var/log/app.log",
  lineNumber: searchResult.matches[0].lineNumber,
  contextLines: 20
});
```

### 3. Progressive Context Loading

Start small, expand if needed:

```typescript
// Initial view with minimal context
let context = await navigate_to_line({
  filePath: file,
  lineNumber: target,
  contextLines: 5
});

// If more context needed
if (needsMoreContext) {
  context = await navigate_to_line({
    filePath: file,
    lineNumber: target,
    contextLines: 20
  });
}
```

### 4. Validate Line Numbers

Check file structure first:

```typescript
const structure = await get_file_structure({
  filePath: file
});

if (lineNumber > structure.totalLines) {
  throw new Error(`Line ${lineNumber} exceeds file length`);
}

const context = await navigate_to_line({
  filePath: file,
  lineNumber: lineNumber,
  contextLines: 10
});
```

### 5. Use for Code Navigation

Build navigation history:

```typescript
class CodeNavigator {
  private history: number[] = [];

  async goToLine(file: string, line: number) {
    this.history.push(line);
    return await navigate_to_line({
      filePath: file,
      lineNumber: line,
      contextLines: 15
    });
  }

  async goBack(file: string) {
    this.history.pop(); // Remove current
    const previous = this.history[this.history.length - 1];
    return await navigate_to_line({
      filePath: file,
      lineNumber: previous,
      contextLines: 15
    });
  }
}
```

## Integration Examples

### With Error Stack Traces

```typescript
function parseStackTrace(error: Error) {
  // Extract: "at processData (app.ts:1234:15)"
  const match = error.stack.match(/\((.+):(\d+):\d+\)/);
  if (match) {
    return {
      file: match[1],
      line: parseInt(match[2])
    };
  }
}

async function investigateError(error: Error) {
  const location = parseStackTrace(error);
  const context = await navigate_to_line({
    filePath: location.file,
    lineNumber: location.line,
    contextLines: 20
  });
  console.log("Error location:", context);
}
```

### With Version Control

```typescript
async function showBlame(file: string, line: number) {
  // Get code context
  const context = await navigate_to_line({
    filePath: file,
    lineNumber: line,
    contextLines: 5
  });

  // Get git blame
  const blame = await exec(`git blame -L ${line},${line} ${file}`);

  return {
    code: context,
    blame: blame
  };
}
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [read_large_file_chunk](/api/read-chunk) - Read file chunks
- [search_in_large_file](/api/search) - Search for patterns
- [get_file_structure](/api/structure) - File metadata
- [Code Navigation Example](/examples/code-navigation) - Real-world usage
- [Best Practices](/guide/best-practices) - Usage recommendations
