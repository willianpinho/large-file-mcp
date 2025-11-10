# Large File MCP Server

A production-ready Model Context Protocol (MCP) server for intelligent handling of large files with smart chunking, navigation, and streaming capabilities.

## Features

- **Intelligent Chunking**: Automatically determines optimal chunk size based on file type
- **Smart Navigation**: Jump to specific lines with context
- **Powerful Search**: Regex support with context lines before/after matches
- **File Analysis**: Comprehensive metadata and statistical analysis
- **Memory Efficient**: Stream files of any size without loading into memory
- **Performance Optimized**: Built-in caching for frequently accessed chunks
- **Type Safe**: Written in TypeScript with strict typing
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Supported File Types

The server intelligently detects and optimizes for:

- **Text files** (.txt)
- **Log files** (.log)
- **Code files** (.ts, .js, .py, .java, .cpp, .go, .rs, etc.)
- **CSV files** (.csv)
- **JSON files** (.json)
- **XML files** (.xml)
- **Markdown files** (.md)
- **Configuration files** (.yml, .yaml, .sh, .bash)

## Installation

### From npm (when published)

```bash
npm install -g @willianpinho/large-file-mcp
```

### From source

```bash
git clone https://github.com/willianpinho/large-file-mcp.git
cd large-file-mcp
npm install
npm run build
```

## Configuration

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "large-file": {
      "command": "npx",
      "args": ["-y", "@willianpinho/large-file-mcp"],
      "env": {
        "CHUNK_SIZE": "500",
        "OVERLAP_LINES": "10",
        "CACHE_SIZE": "104857600",
        "CACHE_TTL": "300000",
        "CACHE_ENABLED": "true"
      }
    }
  }
}
```

### For Claude Code CLI

Add to your MCP settings configuration:

```json
{
  "mcpServers": {
    "large-file": {
      "command": "node",
      "args": ["/path/to/large-file-mcp/dist/index.js"],
      "env": {
        "CHUNK_SIZE": "500",
        "CACHE_ENABLED": "true"
      }
    }
  }
}
```

### For Gemini

```json
{
  "tools": [
    {
      "name": "large-file-mcp",
      "command": "npx @willianpinho/large-file-mcp",
      "protocol": "mcp"
    }
  ]
}
```

### For GitHub Copilot / Codex

```json
{
  "github.copilot.advanced": {
    "mcp.servers": {
      "large-file": {
        "command": "npx",
        "args": ["-y", "@willianpinho/large-file-mcp"]
      }
    }
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CHUNK_SIZE` | Default lines per chunk | 500 |
| `OVERLAP_LINES` | Overlap between chunks | 10 |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 10GB |
| `CACHE_SIZE` | Cache size in bytes | 100MB |
| `CACHE_TTL` | Cache TTL in milliseconds | 5 minutes |
| `CACHE_ENABLED` | Enable/disable caching | true |

## Available Tools

### 1. read_large_file_chunk

Read a specific chunk of a large file with intelligent chunking.

**Parameters:**
- `filePath` (string, required): Absolute path to the file
- `chunkIndex` (number, optional): Zero-based chunk index (default: 0)
- `linesPerChunk` (number, optional): Lines per chunk (auto-detected if not provided)
- `includeLineNumbers` (boolean, optional): Include line numbers (default: false)

**Example:**
```json
{
  "filePath": "/var/log/system.log",
  "chunkIndex": 0,
  "includeLineNumbers": true
}
```

**Response:**
```json
{
  "content": "log content...",
  "startLine": 1,
  "endLine": 500,
  "totalLines": 15000,
  "chunkIndex": 0,
  "totalChunks": 30,
  "filePath": "/var/log/system.log",
  "byteOffset": 0,
  "byteSize": 32768
}
```

### 2. search_in_large_file

Search for patterns in large files with context.

**Parameters:**
- `filePath` (string, required): Absolute path to the file
- `pattern` (string, required): Search pattern
- `caseSensitive` (boolean, optional): Case sensitive search (default: false)
- `regex` (boolean, optional): Use regex pattern (default: false)
- `maxResults` (number, optional): Maximum results (default: 100)
- `contextBefore` (number, optional): Context lines before match (default: 2)
- `contextAfter` (number, optional): Context lines after match (default: 2)
- `startLine` (number, optional): Start line for search
- `endLine` (number, optional): End line for search

**Example:**
```json
{
  "filePath": "/var/log/error.log",
  "pattern": "ERROR.*database",
  "regex": true,
  "maxResults": 50,
  "contextBefore": 3,
  "contextAfter": 3
}
```

**Response:**
```json
{
  "totalResults": 12,
  "results": [
    {
      "lineNumber": 1543,
      "lineContent": "ERROR: database connection timeout",
      "matchPositions": [
        { "start": 0, "end": 5 },
        { "start": 7, "end": 15 }
      ],
      "contextBefore": ["...", "..."],
      "contextAfter": ["...", "..."],
      "chunkIndex": 3
    }
  ]
}
```

### 3. get_file_structure

Analyze file structure and get comprehensive metadata.

**Parameters:**
- `filePath` (string, required): Absolute path to the file

**Example:**
```json
{
  "filePath": "/data/large_dataset.csv"
}
```

**Response:**
```json
{
  "metadata": {
    "path": "/data/large_dataset.csv",
    "sizeBytes": 524288000,
    "sizeFormatted": "500.00 MB",
    "totalLines": 1000000,
    "encoding": "utf-8",
    "fileType": "csv",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "modifiedAt": "2024-01-10T12:00:00.000Z",
    "isText": true
  },
  "lineStats": {
    "total": 1000000,
    "empty": 0,
    "nonEmpty": 1000000,
    "maxLineLength": 256,
    "avgLineLength": 128
  },
  "recommendedChunkSize": 1000,
  "estimatedChunks": 1000,
  "sampleStart": ["header line", "data line 1", "..."],
  "sampleEnd": ["...", "last data line"]
}
```

### 4. navigate_to_line

Jump to a specific line with surrounding context.

**Parameters:**
- `filePath` (string, required): Absolute path to the file
- `lineNumber` (number, required): Line number to navigate to (1-indexed)
- `contextLines` (number, optional): Context lines before/after (default: 5)

**Example:**
```json
{
  "filePath": "/code/app.ts",
  "lineNumber": 1250,
  "contextLines": 10
}
```

**Response:**
```json
{
  "content": "  1240: function example() {\n→ 1250: const target = 'here';\n  1260: }",
  "startLine": 1240,
  "endLine": 1260,
  "totalLines": 5000,
  "chunkIndex": 2,
  "totalChunks": 10,
  "filePath": "/code/app.ts",
  "byteOffset": 0,
  "byteSize": 512
}
```

### 5. get_file_summary

Get comprehensive statistical summary of a file.

**Parameters:**
- `filePath` (string, required): Absolute path to the file

**Example:**
```json
{
  "filePath": "/documents/report.txt"
}
```

**Response:**
```json
{
  "metadata": { /* ... */ },
  "lineStats": {
    "total": 1000,
    "empty": 50,
    "nonEmpty": 950,
    "maxLength": 120,
    "avgLength": 80
  },
  "charStats": {
    "total": 80000,
    "alphabetic": 60000,
    "numeric": 5000,
    "whitespace": 10000,
    "special": 5000
  },
  "wordCount": 12000
}
```

### 6. stream_large_file

Stream a file in chunks for processing very large files.

**Parameters:**
- `filePath` (string, required): Absolute path to the file
- `chunkSize` (number, optional): Chunk size in bytes (default: 64KB)
- `startOffset` (number, optional): Starting byte offset (default: 0)
- `maxBytes` (number, optional): Maximum bytes to stream
- `maxChunks` (number, optional): Maximum chunks to return (default: 10)

**Example:**
```json
{
  "filePath": "/data/huge_file.bin",
  "chunkSize": 1048576,
  "maxChunks": 5
}
```

**Response:**
```json
{
  "totalChunks": 5,
  "chunks": ["chunk1...", "chunk2...", "..."],
  "note": "Reached maxChunks limit. Increase maxChunks or use startOffset to continue."
}
```

## Usage Examples

### Example 1: Reading a Large Log File

```typescript
// Read first chunk of a log file
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/var/log/application.log",
    "chunkIndex": 0,
    "includeLineNumbers": true
  }
}

// Search for errors in the log
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/application.log",
    "pattern": "ERROR|FATAL",
    "regex": true,
    "contextBefore": 5,
    "contextAfter": 5
  }
}
```

### Example 2: Analyzing a Large CSV

```typescript
// Get file structure to understand the CSV
{
  "tool": "get_file_structure",
  "arguments": {
    "filePath": "/data/sales_2024.csv"
  }
}

// Read specific chunk based on recommended size
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/data/sales_2024.csv",
    "chunkIndex": 5
    // linesPerChunk will be auto-detected from structure
  }
}
```

### Example 3: Code Navigation

```typescript
// Navigate to a specific function
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/src/app.ts",
    "lineNumber": 1543,
    "contextLines": 20
  }
}

// Search for function definitions
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/code/src/app.ts",
    "pattern": "^\\s*function\\s+\\w+",
    "regex": true,
    "maxResults": 200
  }
}
```

### Example 4: Processing a Huge File

```typescript
// Stream a 10GB file in manageable chunks
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/huge_dataset.json",
    "chunkSize": 1048576,  // 1MB chunks
    "maxChunks": 100,
    "startOffset": 0
  }
}

// Continue from where we left off
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/data/huge_dataset.json",
    "chunkSize": 1048576,
    "maxChunks": 100,
    "startOffset": 104857600  // 100MB offset
  }
}
```

## Performance Considerations

### Caching

The server implements intelligent caching to improve performance:

- **Chunk Cache**: Frequently accessed chunks are cached
- **Metadata Cache**: File structure information is cached
- **LRU Eviction**: Least recently used entries are evicted when cache is full
- **TTL**: Cache entries expire after configured TTL

### Memory Management

- **Streaming**: Files are streamed line-by-line, not loaded into memory
- **Configurable Chunk Size**: Adjust based on your use case
- **Overlap Lines**: Context between chunks without re-reading

### Optimal Chunk Sizes by File Type

| File Type | Default Chunk Size | Rationale |
|-----------|-------------------|-----------|
| Log files | 500 lines | Balance between context and size |
| CSV files | 1000 lines | Efficient for tabular data |
| JSON files | 100 lines | Preserve object boundaries |
| Code files | 300 lines | Typical function/class size |
| Text files | 500 lines | General purpose |

## Error Handling

All tools return proper error responses:

```json
{
  "error": "File not accessible: /invalid/path.txt",
  "code": "TOOL_EXECUTION_ERROR",
  "details": {}
}
```

Common error codes:
- `FILE_NOT_FOUND`: File doesn't exist
- `FILE_NOT_ACCESSIBLE`: No read permissions
- `INVALID_LINE_NUMBER`: Line number out of range
- `INVALID_CHUNK_INDEX`: Chunk index out of range
- `TOOL_EXECUTION_ERROR`: General execution error

## Development

### Building

```bash
npm run build
```

### Running in Development

```bash
npm run dev  # Watch mode
npm start    # Run built version
```

### Linting

```bash
npm run lint
```

### Testing

```bash
# Manual testing with sample files
node dist/index.js
```

## Architecture

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server implementation
├── fileHandler.ts     # Core file handling logic
├── cacheManager.ts    # Caching implementation
└── types.ts           # TypeScript type definitions
```

### Key Components

- **FileHandler**: Core logic for reading, searching, and analyzing files
- **CacheManager**: LRU cache with TTL for performance optimization
- **LargeFileMCPServer**: MCP protocol implementation and tool handlers

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.

## Troubleshooting

### Issue: "File not accessible"

**Solution**: Ensure the file path is absolute and the file has read permissions.

```bash
chmod +r /path/to/file
```

### Issue: "Out of memory"

**Solution**:
1. Reduce `CHUNK_SIZE` environment variable
2. Disable cache with `CACHE_ENABLED=false`
3. Use `stream_large_file` instead of `read_large_file_chunk` for very large files

### Issue: "Slow search performance"

**Solution**:
1. Reduce `maxResults` parameter
2. Use `startLine` and `endLine` to limit search range
3. Enable caching if disabled

### Issue: Cache not working

**Solution**:
1. Check `CACHE_ENABLED` is set to `true`
2. Verify `CACHE_SIZE` is sufficient
3. Check `CACHE_TTL` is appropriate for your use case

## Roadmap

- [ ] Add support for binary file analysis
- [ ] Implement parallel search across multiple files
- [ ] Add compression support (gzip, bzip2)
- [ ] Implement incremental search for real-time monitoring
- [ ] Add file watching capabilities
- [ ] Performance benchmarks and optimization
- [ ] Unit and integration tests
- [ ] Docker container for easy deployment

## Support

For issues, questions, or suggestions:
- GitHub Issues: https://github.com/willianpinho/large-file-mcp/issues
- Email: [your-email@example.com]

## Acknowledgments

Built with:
- [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- TypeScript
- Node.js

---

Made with ❤️ for the AI developer community
