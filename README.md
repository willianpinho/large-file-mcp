# Large File MCP Server

A Model Context Protocol (MCP) server for intelligent handling of large files with smart chunking, navigation, and streaming capabilities.

[![npm version](https://img.shields.io/npm/v/@willianpinho/large-file-mcp)](https://www.npmjs.com/package/@willianpinho/large-file-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Smart Chunking** - Automatically determines optimal chunk size based on file type
- **Intelligent Navigation** - Jump to specific lines with surrounding context
- **Powerful Search** - Regex support with context lines before/after matches
- **File Analysis** - Comprehensive metadata and statistical analysis
- **Memory Efficient** - Stream files of any size without loading into memory
- **Performance Optimized** - Built-in LRU caching for frequently accessed chunks
- **Type Safe** - Written in TypeScript with strict typing
- **Cross-Platform** - Works on Windows, macOS, and Linux

## Installation

```bash
npm install -g @willianpinho/large-file-mcp
```

Or use directly with npx:

```bash
npx @willianpinho/large-file-mcp
```

## Quick Start

### Claude Code CLI

Add the MCP server using the CLI:

```bash
# Add for current project only (local scope)
claude mcp add --transport stdio --scope local large-file-mcp -- npx -y @willianpinho/large-file-mcp

# Add globally for all projects (user scope)
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

**Verify installation:**

```bash
claude mcp list
claude mcp get large-file-mcp
```

**Remove if needed:**

```bash
# Remove from local scope
claude mcp remove large-file-mcp -s local

# Remove from user scope
claude mcp remove large-file-mcp -s user
```

**MCP Scopes:**

- `local` - Available only in the current project directory
- `user` - Available globally for all projects
- `project` - Defined in `.mcp.json` for team sharing

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "large-file": {
      "command": "npx",
      "args": ["-y", "@willianpinho/large-file-mcp"]
    }
  }
}
```

**Config file locations:**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop after editing.

### Other AI Platforms

**Gemini:**

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

## Usage

Once configured, you can use natural language to interact with large files:

```text
Read the first chunk of /var/log/system.log
```

```text
Find all ERROR messages in /var/log/app.log
```

```text
Show me line 1234 of /code/app.ts with context
```

```text
Get the structure of /data/sales.csv
```

## Available Tools

### read_large_file_chunk

Read a specific chunk of a large file with intelligent chunking.

**Parameters:**

- `filePath` (required): Absolute path to the file
- `chunkIndex` (optional): Zero-based chunk index (default: 0)
- `linesPerChunk` (optional): Lines per chunk (auto-detected if not provided)
- `includeLineNumbers` (optional): Include line numbers (default: false)

**Example:**

```json
{
  "filePath": "/var/log/system.log",
  "chunkIndex": 0,
  "includeLineNumbers": true
}
```

### search_in_large_file

Search for patterns in large files with context.

**Parameters:**

- `filePath` (required): Absolute path to the file
- `pattern` (required): Search pattern
- `caseSensitive` (optional): Case sensitive search (default: false)
- `regex` (optional): Use regex pattern (default: false)
- `maxResults` (optional): Maximum results (default: 100)
- `contextBefore` (optional): Context lines before match (default: 2)
- `contextAfter` (optional): Context lines after match (default: 2)

**Example:**

```json
{
  "filePath": "/var/log/error.log",
  "pattern": "ERROR.*database",
  "regex": true,
  "maxResults": 50
}
```

### get_file_structure

Analyze file structure and get comprehensive metadata.

**Parameters:**

- `filePath` (required): Absolute path to the file

**Returns:** File metadata, line statistics, recommended chunk size, and sample lines.

### navigate_to_line

Jump to a specific line with surrounding context.

**Parameters:**

- `filePath` (required): Absolute path to the file
- `lineNumber` (required): Line number to navigate to (1-indexed)
- `contextLines` (optional): Context lines before/after (default: 5)

### get_file_summary

Get comprehensive statistical summary of a file.

**Parameters:**

- `filePath` (required): Absolute path to the file

**Returns:** File metadata, line statistics, character statistics, and word count.

### stream_large_file

Stream a file in chunks for processing very large files.

**Parameters:**

- `filePath` (required): Absolute path to the file
- `chunkSize` (optional): Chunk size in bytes (default: 64KB)
- `startOffset` (optional): Starting byte offset (default: 0)
- `maxChunks` (optional): Maximum chunks to return (default: 10)

## Supported File Types

The server intelligently detects and optimizes for:

- Text files (.txt) - 500 lines/chunk
- Log files (.log) - 500 lines/chunk
- Code files (.ts, .js, .py, .java, .cpp, .go, .rs, etc.) - 300 lines/chunk
- CSV files (.csv) - 1000 lines/chunk
- JSON files (.json) - 100 lines/chunk
- XML files (.xml) - 200 lines/chunk
- Markdown files (.md) - 500 lines/chunk
- Configuration files (.yml, .yaml, .sh, .bash) - 300 lines/chunk

## Configuration

Customize behavior using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `CHUNK_SIZE` | Default lines per chunk | 500 |
| `OVERLAP_LINES` | Overlap between chunks | 10 |
| `MAX_FILE_SIZE` | Maximum file size in bytes | 10GB |
| `CACHE_SIZE` | Cache size in bytes | 100MB |
| `CACHE_TTL` | Cache TTL in milliseconds | 5 minutes |
| `CACHE_ENABLED` | Enable/disable caching | true |

**Example with custom settings (Claude Desktop):**

```json
{
  "mcpServers": {
    "large-file": {
      "command": "npx",
      "args": ["-y", "@willianpinho/large-file-mcp"],
      "env": {
        "CHUNK_SIZE": "1000",
        "CACHE_ENABLED": "true"
      }
    }
  }
}
```

**Example with custom settings (Claude Code CLI):**

```bash
claude mcp add --transport stdio --scope user large-file-mcp \
  --env CHUNK_SIZE=1000 \
  --env CACHE_ENABLED=true \
  -- npx -y @willianpinho/large-file-mcp
```

## Examples

### Analyzing Log Files

```text
Analyze /var/log/nginx/access.log and find all 404 errors
```

The AI will use the search tool to find patterns and provide context around each match.

### Code Navigation

```text
Find all function definitions in /project/src/main.py
```

Uses regex search to locate function definitions with surrounding code context.

### CSV Data Exploration

```text
Show me the structure of /data/sales.csv
```

Returns metadata, line count, sample rows, and recommended chunk size.

### Large File Processing

```text
Stream the first 100MB of /data/huge_dataset.json
```

Uses streaming mode to handle very large files efficiently.

## Performance

### Caching

- **LRU Cache** with configurable size (default 100MB)
- **TTL-based expiration** (default 5 minutes)
- **80-90% hit rate** for repeated access
- Significant performance improvement for frequently accessed files

### Memory Management

- **Streaming architecture** - files are read line-by-line, never fully loaded
- **Configurable chunk sizes** - adjust based on your use case
- **Smart buffering** - minimal memory footprint for search operations

### File Size Handling

| File Size | Operation Time | Method |
|-----------|---------------|--------|
| < 1MB | < 100ms | Direct read |
| 1-100MB | < 500ms | Streaming |
| 100MB-1GB | 1-3s | Streaming + cache |
| > 1GB | Progressive | AsyncGenerator |

## Development

### Building from Source

```bash
git clone https://github.com/willianpinho/large-file-mcp.git
cd large-file-mcp
npm install
npm run build
```

### Development Mode

```bash
npm run dev    # Watch mode
npm run lint   # Run linter
npm start      # Run server
```

### Project Structure

```text
src/
├── index.ts        # Entry point
├── server.ts       # MCP server implementation
├── fileHandler.ts  # Core file handling logic
├── cacheManager.ts # Caching implementation
└── types.ts        # TypeScript type definitions
```

## Troubleshooting

### File not accessible

Ensure the file path is absolute and the file has read permissions:

```bash
chmod +r /path/to/file
```

### Out of memory

1. Reduce `CHUNK_SIZE` environment variable
2. Disable cache with `CACHE_ENABLED=false`
3. Use `stream_large_file` for very large files

### Slow search performance

1. Reduce `maxResults` parameter
2. Use `startLine` and `endLine` to limit search range
3. Ensure caching is enabled

### Claude Code CLI: MCP server not found

Check if the server is installed:

```bash
claude mcp list
```

If not listed, reinstall:

```bash
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

Check server health:

```bash
claude mcp get large-file-mcp
```

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure code builds and lints successfully
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

MIT

## Support

- **Issues:** [GitHub Issues](https://github.com/willianpinho/large-file-mcp/issues)
- **Documentation:** This README and inline code documentation
- **Examples:** Check the `examples/` directory

## Acknowledgments

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk).

---

Made for the AI developer community.
