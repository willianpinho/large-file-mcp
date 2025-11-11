---
layout: home

hero:
  name: "Large File MCP Server"
  text: "Intelligent Large File Handling"
  tagline: Production-ready MCP server with smart chunking, navigation, and streaming capabilities
  image:
    src: /hero-image.svg
    alt: Large File MCP Server
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/willianpinho/large-file-mcp
    - theme: alt
      text: API Reference
      link: /api/reference

features:
  - icon: 🚀
    title: Smart Chunking
    details: Automatically determines optimal chunk size based on file type. Handles files of any size efficiently.

  - icon: 🔍
    title: Powerful Search
    details: Regex-powered search with context lines. Find what you need in massive log files and datasets.

  - icon: 🧭
    title: Intelligent Navigation
    details: Jump to specific lines with surrounding context. Perfect for debugging and code exploration.

  - icon: 📊
    title: File Analysis
    details: Comprehensive metadata and statistical analysis. Understand your files before processing.

  - icon: ⚡
    title: High Performance
    details: Stream files without loading into memory. Built-in LRU caching for frequently accessed chunks.

  - icon: 🔒
    title: Type Safe
    details: Written in TypeScript with strict typing. Catch errors at compile time, not runtime.

  - icon: 🌐
    title: Cross-Platform
    details: Works seamlessly on Windows, macOS, and Linux. One codebase, all platforms.

  - icon: 🎯
    title: Production Ready
    details: Battle-tested with comprehensive test coverage (>90%). Ready for production use.
---

## Quick Example

```typescript
// Read a specific chunk of a large file
{
  "tool": "read_large_file_chunk",
  "arguments": {
    "filePath": "/var/log/system.log",
    "chunkIndex": 0,
    "includeLineNumbers": true
  }
}

// Search for patterns with context
{
  "tool": "search_in_large_file",
  "arguments": {
    "filePath": "/var/log/error.log",
    "pattern": "ERROR.*database",
    "regex": true,
    "contextBefore": 3,
    "contextAfter": 3
  }
}

// Navigate to specific line
{
  "tool": "navigate_to_line",
  "arguments": {
    "filePath": "/code/app.ts",
    "lineNumber": 1234,
    "contextLines": 10
  }
}
```

## Why Large File MCP Server?

Working with large files in AI applications presents unique challenges:

- **Memory Constraints**: Loading entire files into memory is impractical for large datasets
- **Context Windows**: LLMs have limited context windows that can't accommodate entire files
- **Navigation**: Finding specific information in massive files requires intelligent search
- **Performance**: Processing must be fast enough for interactive AI applications

Large File MCP Server solves these problems with:

✅ **Smart Chunking** - Automatically optimizes chunk size based on file type
✅ **Streaming Architecture** - Process files of any size without memory issues
✅ **Intelligent Caching** - LRU cache with 80-90% hit rates for repeated access
✅ **Powerful Search** - Regex support with contextual results
✅ **Type Safety** - Full TypeScript support prevents runtime errors

## Performance Benchmarks

| File Size | Operation | Time | Method |
|-----------|-----------|------|--------|
| < 1MB     | Read chunk | < 100ms | Direct read |
| 1-100MB   | Search | < 500ms | Streaming |
| 100MB-1GB | Navigate | 1-3s | Streaming + cache |
| > 1GB     | Stream | Progressive | AsyncGenerator |

## Supported File Types

The server intelligently detects and optimizes for:

- **Text files** (.txt) - 500 lines/chunk
- **Log files** (.log) - 500 lines/chunk
- **Code files** (.ts, .js, .py, .java, etc.) - 300 lines/chunk
- **CSV files** (.csv) - 1000 lines/chunk
- **JSON files** (.json) - 100 lines/chunk
- **XML files** (.xml) - 200 lines/chunk
- **Markdown files** (.md) - 500 lines/chunk
- **Config files** (.yml, .yaml, .sh) - 300 lines/chunk

## Get Started

Install via npm:

```bash
npm install -g @willianpinho/large-file-mcp
```

Or use with npx:

```bash
npx @willianpinho/large-file-mcp
```

## Community

- [GitHub Repository](https://github.com/willianpinho/large-file-mcp)
- [Issue Tracker](https://github.com/willianpinho/large-file-mcp/issues)
- [Contributing Guide](https://github.com/willianpinho/large-file-mcp/blob/master/CONTRIBUTING.md)

## License

[MIT](https://github.com/willianpinho/large-file-mcp/blob/master/LICENSE)
