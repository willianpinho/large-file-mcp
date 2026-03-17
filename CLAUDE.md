# Large File MCP - MCP Server for Large File Handling

> Published npm package (`@willianpinho/large-file-mcp`) providing MCP tools for reading, searching, and navigating large files that exceed LLM context limits.

## Tech Stack

- **Language:** TypeScript, Node.js 18+
- **Framework:** MCP (Model Context Protocol) SDK
- **Testing:** Jest (with ts-jest)
- **Build:** tsc (TypeScript compiler)
- **Package:** npm (`@willianpinho/large-file-mcp`)

## Commands

```bash
npm install
npm run build               # Compile TypeScript
npm run dev                 # Watch mode
npm test                    # Jest tests
npm run test:coverage       # Coverage report
npm run lint                # ESLint

# Publish
npm version patch|minor|major
npm publish --access public
```

## MCP Tools Provided

| Tool | Purpose |
|------|---------|
| `read_large_file_chunk` | Read file chunks with intelligent splitting |
| `search_in_large_file` | Regex search with context lines |
| `get_file_structure` | File metadata and line statistics |
| `navigate_to_line` | Jump to specific line with context |
| `get_file_summary` | Statistical summary (lines, chars, words) |
| `stream_large_file` | Stream file in byte-based chunks |

## Architecture

```
src/
├── index.ts               # MCP server entry point
├── tools/                 # Tool implementations
├── utils/                 # File reading utilities
└── types.ts               # TypeScript types

__tests__/                 # Jest test suites
dist/                      # Compiled output (npm entry)
Dockerfile                 # Container build
```

## Docker

```bash
docker build -t large-file-mcp .
docker run -p 3080:3080 large-file-mcp
```

## Recommended Agents

`mcp-developer`, `typescript-agent`, `sdk-developer`
