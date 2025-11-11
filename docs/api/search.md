# search_in_large_file

Search for patterns in large files with regex support and contextual results.

## Overview

The `search_in_large_file` tool provides powerful search capabilities for large files without loading the entire file into memory. It supports both literal string matching and regular expressions, with configurable context lines before and after each match.

## Usage

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/error.log",
    "pattern": "ERROR.*database",
    "regex": true,
    "contextBefore": 3,
    "contextAfter": 3,
    "maxResults": 50
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | Yes | - | Absolute or relative path to the file |
| `pattern` | string | Yes | - | Search pattern (literal or regex) |
| `regex` | boolean | No | false | Whether to treat pattern as regex |
| `contextBefore` | number | No | 0 | Number of lines before match to include |
| `contextAfter` | number | No | 0 | Number of lines after match to include |
| `maxResults` | number | No | 100 | Maximum number of matches to return |
| `caseSensitive` | boolean | No | true | Whether search is case-sensitive |

## Response Format

```typescript
{
  matches: Array<{
    lineNumber: number;      // Line number of match
    line: string;            // Matched line content
    contextBefore: string[]; // Lines before match
    contextAfter: string[];  // Lines after match
  }>;
  totalMatches: number;      // Total matches found
  searchTime: number;        // Search duration in ms
  scannedLines: number;      // Total lines scanned
  truncated: boolean;        // Whether results were limited
}
```

## Examples

### Basic String Search

Search for exact string match:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/system.log",
    "pattern": "ERROR",
    "regex": false
  }
}
```

Response:
```json
{
  "matches": [
    {
      "lineNumber": 1234,
      "line": "2024-01-10 10:15:23 ERROR Connection timeout",
      "contextBefore": [],
      "contextAfter": []
    }
  ],
  "totalMatches": 15,
  "searchTime": 245,
  "scannedLines": 10000,
  "truncated": false
}
```

### Regex Search with Context

Search using regex with surrounding context:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/app.log",
    "pattern": "ERROR.*database.*timeout",
    "regex": true,
    "contextBefore": 3,
    "contextAfter": 3
  }
}
```

Response:
```json
{
  "matches": [
    {
      "lineNumber": 5678,
      "line": "ERROR: database connection timeout after 30s",
      "contextBefore": [
        "INFO: Attempting to connect to database",
        "INFO: Retrying connection (attempt 1/3)",
        "WARN: Connection delayed"
      ],
      "contextAfter": [
        "INFO: Initiating connection retry",
        "INFO: Retry successful",
        "INFO: Database connection established"
      ]
    }
  ],
  "totalMatches": 3,
  "searchTime": 567,
  "scannedLines": 50000,
  "truncated": false
}
```

### Case-Insensitive Search

Search without case sensitivity:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/code/app.ts",
    "pattern": "function.*process",
    "regex": true,
    "caseSensitive": false,
    "contextAfter": 5
  }
}
```

### Limited Results

Limit maximum number of results:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/data/transactions.csv",
    "pattern": "completed",
    "maxResults": 10
  }
}
```

Response:
```json
{
  "matches": [...],
  "totalMatches": 1523,
  "searchTime": 1234,
  "scannedLines": 100000,
  "truncated": true
}
```

## Common Use Cases

### 1. Error Log Analysis

Find all database errors with context:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/error.log",
    "pattern": "(ERROR|FATAL).*database",
    "regex": true,
    "contextBefore": 5,
    "contextAfter": 5
  }
}
```

### 2. Security Audit

Search for failed login attempts:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/auth.log",
    "pattern": "Failed password.*from (\\d{1,3}\\.){3}\\d{1,3}",
    "regex": true,
    "contextAfter": 2
  }
}
```

### 3. Performance Investigation

Find slow queries in application logs:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/app.log",
    "pattern": "Query took [0-9]{4,}ms",
    "regex": true,
    "contextBefore": 3
  }
}
```

### 4. Code Navigation

Find function definitions:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/code/app.ts",
    "pattern": "^(export\\s+)?(async\\s+)?function\\s+\\w+",
    "regex": true,
    "contextAfter": 10
  }
}
```

### 5. Data Validation

Find invalid records in CSV:

```json
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/data/users.csv",
    "pattern": "^[^,]*,(?!.*@.*\\.).*$",
    "regex": true,
    "maxResults": 50
  }
}
```

## Performance

| File Size | Pattern Type | Search Time | Notes |
|-----------|-------------|-------------|-------|
| < 1MB | Literal | < 100ms | In-memory search |
| 1-10MB | Literal | 100-300ms | Streaming |
| 10-100MB | Literal | 300-1000ms | Line-by-line |
| 100MB-1GB | Literal | 1-5s | Optimized streaming |
| Any size | Regex (simple) | +20-50% | Pattern compilation |
| Any size | Regex (complex) | +100-200% | Backtracking |

### Optimization Tips

1. **Use Literal Search When Possible**: Literal searches are significantly faster than regex
2. **Limit Context Lines**: Fewer context lines = faster processing
3. **Restrict Max Results**: Use `maxResults` to prevent scanning entire file
4. **Simplify Regex Patterns**: Avoid complex lookaheads/lookbehinds

## Regular Expression Patterns

### Common Patterns

```javascript
// IP Address
"(\\d{1,3}\\.){3}\\d{1,3}"

// Email
"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"

// Timestamp (ISO 8601)
"\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}"

// Error codes
"(ERROR|WARN|FATAL)\\s+\\d{3,4}"

// Function definitions (JavaScript/TypeScript)
"(export\\s+)?(async\\s+)?function\\s+\\w+"

// SQL queries
"(SELECT|INSERT|UPDATE|DELETE)\\s+.+\\s+(FROM|INTO)\\s+"

// HTTP status codes
"(HTTP/\\d\\.\\d\\s+)?(2\\d{2}|3\\d{2}|4\\d{2}|5\\d{2})"

// Currency amounts
"\\$\\d+(\\.\\d{2})?"
```

## Error Handling

### File Not Found

```json
{
  "error": "File not found: /path/to/file.log",
  "code": "ENOENT"
}
```

### Invalid Regex

```json
{
  "error": "Invalid regular expression: Unterminated group",
  "code": "INVALID_REGEX"
}
```

### Permission Denied

```json
{
  "error": "Permission denied: /root/protected.log",
  "code": "EACCES"
}
```

### No Matches Found

```json
{
  "matches": [],
  "totalMatches": 0,
  "searchTime": 456,
  "scannedLines": 10000,
  "truncated": false
}
```

## Best Practices

### 1. Progressive Search

For large files, start with limited results:

```json
{
  "maxResults": 10,
  "contextBefore": 1,
  "contextAfter": 1
}
```

### 2. Use Anchors

Optimize regex with line anchors:

```javascript
// Good: Anchored search
"^ERROR"

// Bad: Unanchored (scans entire line)
"ERROR"
```

### 3. Context Lines Trade-off

Balance context vs. performance:

```json
// Quick overview: minimal context
{
  "contextBefore": 1,
  "contextAfter": 1
}

// Deep investigation: more context
{
  "contextBefore": 5,
  "contextAfter": 5
}
```

### 4. Combine with Other Tools

Use search results to navigate:

```javascript
// Step 1: Find errors
const searchResult = await search_in_large_file({
  pattern: "ERROR",
  maxResults: 1
});

// Step 2: Navigate to first error
const context = await navigate_to_line({
  filePath: searchResult.matches[0].lineNumber,
  contextLines: 20
});
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [read_large_file_chunk](/api/read-chunk) - Read file chunks
- [navigate_to_line](/api/navigate) - Jump to specific lines
- [get_file_structure](/api/structure) - Analyze file structure
- [Log Analysis Example](/examples/log-analysis) - Real-world examples
- [Performance Guide](/guide/performance) - Optimization strategies
