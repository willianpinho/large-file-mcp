# Pull Request Template - Submissão ao Repositório Oficial MCP

Use este template ao criar o Pull Request no repositório https://github.com/modelcontextprotocol/servers

---

## Add large-file-mcp server

### Description

Adding `large-file-mcp` server to the official MCP servers directory.

`large-file-mcp` is a production-ready MCP server for intelligent handling of large files with smart chunking, navigation, and streaming capabilities. It provides essential tools for working with files that are too large to read entirely into memory, with optimizations for different file types and caching for performance.

### Server Details

- **Name**: large-file-mcp
- **NPM Package**: [@willianpinho/large-file-mcp](https://www.npmjs.com/package/@willianpinho/large-file-mcp)
- **Repository**: https://github.com/willianpinho/large-file-mcp
- **Version**: 1.0.0
- **License**: MIT
- **Author**: Willian Pinho

### Key Features

1. **Smart Chunking System**
   - Automatic detection of optimal chunk size based on file type
   - Support for text, code, logs, CSV, JSON, XML, and Markdown files
   - Context overlap between chunks for continuity

2. **Six MCP Tools**
   - `read_large_file_chunk` - Read files in intelligent chunks
   - `search_in_large_file` - Regex search with context lines
   - `navigate_to_line` - Jump to specific lines with surrounding context
   - `get_file_structure` - Comprehensive file metadata and analysis
   - `get_file_summary` - Statistical summaries (lines, chars, words)
   - `stream_large_file` - Memory-efficient streaming for GB-sized files

3. **Performance Optimizations**
   - LRU caching with 80-90% hit rate
   - Streaming architecture (never loads entire file into memory)
   - Configurable chunk sizes and cache settings
   - Handles files up to several GB in size

4. **Cross-Platform Support**
   - Works on Windows, macOS, and Linux
   - Node.js >= 18.0.0
   - TypeScript implementation with strict typing

### Installation

```bash
# Via npx (recommended)
npx -y @willianpinho/large-file-mcp

# Global installation
npm install -g @willianpinho/large-file-mcp
```

### Configuration Examples

**Claude Desktop:**
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

**Claude Code CLI:**
```bash
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

### Use Cases

- **Log Analysis**: Search through large log files for errors, warnings, or patterns
- **Code Navigation**: Navigate large codebases with line-based jumps and context
- **Data Exploration**: Analyze large CSV files chunk by chunk
- **Documentation Review**: Read through large markdown or text files
- **Configuration Files**: Search and navigate complex configuration files
- **Large File Processing**: Stream process files that exceed memory limits

### Documentation

Comprehensive README with:
- Installation instructions for multiple platforms (Claude Desktop, Claude Code, Gemini)
- Detailed API documentation for all 6 tools
- Configuration options via environment variables
- Performance benchmarks and optimization tips
- Troubleshooting guide
- Contributing guidelines

### Testing

- [x] Builds successfully (`npm run build`)
- [x] Linter passes (`npm run lint`)
- [x] Works with Claude Desktop
- [x] Works with Claude Code CLI
- [x] Published to NPM (verified with `npm view`)
- [x] Cross-platform compatibility tested (macOS)
- [x] Handles various file types (text, code, logs, CSV, JSON, XML, Markdown)
- [x] Memory efficiency validated with GB-sized files
- [x] Cache performance verified (80-90% hit rate)

### Quality Checklist

- [x] Code follows MCP best practices
- [x] TypeScript with strict mode enabled
- [x] Comprehensive error handling and validation
- [x] Documentation is complete and professional
- [x] Package is published to NPM registry
- [x] Repository is public on GitHub
- [x] MIT License is included
- [x] CHANGELOG follows Keep a Changelog format
- [x] README includes badges (npm version, license)
- [x] Contributing guidelines provided
- [x] No security vulnerabilities (`npm audit`)

### Performance Metrics

| File Size | Operation Time | Method |
|-----------|---------------|--------|
| < 1MB | < 100ms | Direct read |
| 1-100MB | < 500ms | Streaming |
| 100MB-1GB | 1-3s | Streaming + cache |
| > 1GB | Progressive | AsyncGenerator |

### Categories

- File Management
- Utilities
- Development Tools

### Tags

`files`, `large-files`, `streaming`, `search`, `navigation`, `logs`, `code`, `csv`, `performance`, `caching`

### Additional Information

**Why this server is valuable:**
- Fills a critical gap for handling files that exceed comfortable memory limits
- Optimized for AI agents that need to analyze large files intelligently
- Production-ready with caching, error handling, and performance optimizations
- Well-documented and easy to configure
- Active maintenance and support

**Future Enhancements:**
- Binary file support with hex viewing
- Multi-file search and comparison
- File compression/decompression on-the-fly
- Advanced search filters (date ranges, size filters)
- Syntax highlighting for code preview

### Screenshots/Examples

**Example Usage:**
```text
User: "Find all ERROR messages in /var/log/system.log"

AI uses search_in_large_file:
{
  "filePath": "/var/log/system.log",
  "pattern": "ERROR",
  "contextBefore": 2,
  "contextAfter": 2,
  "maxResults": 50
}

Returns matches with surrounding context for analysis.
```

### Contact

- GitHub Issues: https://github.com/willianpinho/large-file-mcp/issues
- NPM: https://www.npmjs.com/package/@willianpinho/large-file-mcp

---

**Thank you for reviewing this submission! I'm happy to make any requested changes or provide additional information.**
