# Installation

## Prerequisites

- Node.js >= 18.0.0
- npm or npx

## Installation Methods

### Global Installation

Install globally to use across all projects:

```bash
npm install -g @willianpinho/large-file-mcp
```

Verify installation:

```bash
large-file-mcp --version
```

### Using npx

No installation required - use directly:

```bash
npx @willianpinho/large-file-mcp
```

### From Source

Clone and build from source:

```bash
git clone https://github.com/willianpinho/large-file-mcp.git
cd large-file-mcp
npm install
npm run build
npm start
```

## Platform-Specific Setup

### Claude Desktop

**macOS:**
```bash
# Edit config file
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
# Edit config file
notepad %APPDATA%\Claude\claude_desktop_config.json
```

Add configuration:
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

Restart Claude Desktop.

### Claude Code CLI

```bash
# Add for current project
claude mcp add --transport stdio --scope local large-file-mcp -- npx -y @willianpinho/large-file-mcp

# Add globally for all projects
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

Verify:
```bash
claude mcp list
claude mcp get large-file-mcp
```

### Other MCP-Compatible Platforms

**Generic MCP configuration:**
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

## Configuration

Customize behavior with environment variables:

```bash
# For Claude Desktop
{
  "mcpServers": {
    "large-file": {
      "command": "npx",
      "args": ["-y", "@willianpinho/large-file-mcp"],
      "env": {
        "CHUNK_SIZE": "1000",
        "CACHE_ENABLED": "true",
        "CACHE_SIZE": "209715200"
      }
    }
  }
}
```

```bash
# For Claude Code CLI
claude mcp add --transport stdio --scope user large-file-mcp \
  --env CHUNK_SIZE=1000 \
  --env CACHE_ENABLED=true \
  -- npx -y @willianpinho/large-file-mcp
```

## Troubleshooting

### Command not found

Ensure Node.js is installed and in PATH:
```bash
node --version
npm --version
```

### Permission denied

On macOS/Linux, you may need sudo for global install:
```bash
sudo npm install -g @willianpinho/large-file-mcp
```

### MCP server not found (Claude Code)

Check installation:
```bash
claude mcp list
```

Reinstall if needed:
```bash
claude mcp remove large-file-mcp -s user
claude mcp add --transport stdio --scope user large-file-mcp -- npx -y @willianpinho/large-file-mcp
```

### Server fails to start

Check logs in Claude Desktop or run manually:
```bash
npx @willianpinho/large-file-mcp
```

## Next Steps

- [Getting Started](/guide/getting-started) - First steps
- [Configuration](/guide/configuration) - Customize settings
- [Usage](/guide/usage) - Learn how to use
