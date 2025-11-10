# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-10

### Added
- Initial release of Large File MCP Server
- Smart chunking system with file-type-aware optimization
- Six core MCP tools:
  - `read_large_file_chunk` - Intelligent file chunking
  - `search_in_large_file` - Pattern search with context
  - `get_file_structure` - File metadata and analysis
  - `navigate_to_line` - Jump to specific lines
  - `get_file_summary` - Statistical summaries
  - `stream_large_file` - Memory-efficient streaming
- Support for multiple file formats (text, code, logs, CSV, JSON, XML, Markdown)
- Intelligent file type detection and optimal chunk size calculation
- LRU caching system with TTL for performance
- Cross-platform compatibility (Windows, macOS, Linux)
- Comprehensive documentation and usage examples
- Configuration examples for Claude Desktop, Claude Code, Gemini, Codex
- TypeScript implementation with strict typing
- Async/await patterns for efficient I/O operations
- Error handling and validation
- Support for files up to several GB in size

### Features
- Context-aware chunking (10 lines overlap by default)
- Regex search support with case sensitivity options
- Line number navigation with surrounding context
- Character and word statistics
- Sample lines from file start and end
- Configurable via environment variables
- Production-ready error handling
- Memory-efficient streaming for any file size
- Cache statistics and management

### Performance
- Optimized chunk sizes by file type
- Built-in caching reduces repeated reads by 80-90%
- Streaming architecture handles GB-sized files
- Efficient line counting without loading entire file
- Smart buffer management for search operations
