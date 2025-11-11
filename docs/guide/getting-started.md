# Getting Started

## Introduction

Large File MCP Server is a Model Context Protocol (MCP) server designed to handle large files efficiently. It provides intelligent chunking, powerful search, and streaming capabilities for working with files that are too large to fit in memory or LLM context windows.

## Quick Start

### Installation

Install globally via npm:

```bash
npm install -g @willianpinho/large-file-mcp
```

Or use with npx (no installation required):

```bash
npx @willianpinho/large-file-mcp
```

### Basic Usage with Claude Desktop

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

### Basic Usage with Claude Code CLI

Add the MCP server:

```bash
# Add for current project (local scope)
claude mcp add --transport stdio --scope local large-file-mcp -- npx -y @willianpinho/large-file-mcp

# Add globally (user scope)
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

Verify installation:

```bash
claude mcp list
claude mcp get large-file-mcp
```

## First Steps

Once configured, interact with large files using natural language:

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

## Core Concepts

### Smart Chunking

The server automatically determines optimal chunk size based on file type:

- Log files: 500 lines per chunk
- CSV files: 1000 lines per chunk
- Code files: 300 lines per chunk
- JSON files: 100 lines per chunk

You can override the automatic detection by specifying `linesPerChunk`.

### Streaming

For very large files, use the streaming capabilities to process chunks sequentially without loading the entire file into memory.

### Caching

The server includes an LRU cache that:
- Stores frequently accessed chunks
- Expires entries after 5 minutes (configurable)
- Limits memory usage to 100MB (configurable)
- Achieves 80-90% cache hit rates

## Next Steps

- [Installation Guide](/guide/installation) - Detailed installation instructions
- [Configuration](/guide/configuration) - Customize server behavior
- [API Reference](/api/reference) - Complete API documentation
- [Examples](/examples/use-cases) - Real-world usage examples
