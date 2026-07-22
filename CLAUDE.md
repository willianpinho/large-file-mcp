# Large File MCP - MCP Server for Large File Handling

> Published npm package (`@willianpinho/large-file-mcp`) providing MCP tools for reading, searching, and navigating large files that exceed LLM context limits.

## Tech Stack

- **Language:** TypeScript 5.9+, Node.js 18+
- **Framework:** MCP SDK 1.28+
- **Testing:** Jest 30 (with ts-jest)
- **Build:** tsc (TypeScript compiler)
- **Linting:** ESLint 9 (flat config)
- **Package Manager:** pnpm
- **Package:** npm (`@willianpinho/large-file-mcp`)
- **CI/CD:** GitHub Actions with OIDC trusted publisher

## Commands

```bash
pnpm install
pnpm run build              # Compile TypeScript
pnpm run dev                # Watch mode
pnpm test                   # Jest tests
pnpm run test:coverage      # Coverage report
pnpm run lint               # ESLint 9

# Publish (automated via GitHub Actions OIDC)
npm version patch|minor|major
npm publish --access public
```

## MCP Tools Provided

| Tool                    | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `read_large_file_chunk` | Read file chunks with intelligent splitting |
| `search_in_large_file`  | Regex search with context lines             |
| `get_file_structure`    | File metadata and line statistics           |
| `navigate_to_line`      | Jump to specific line with context          |
| `get_file_summary`      | Statistical summary (lines, chars, words)   |
| `stream_large_file`     | Stream file in byte-based chunks            |

## Architecture

```
src/
├── index.ts               # MCP server entry point (stdio transport)
├── server.ts              # Tool registration + request handlers
├── fileHandler.ts         # Thin barrel — FileHandler delegates to src/file-handler/*
├── file-handler/
│   ├── metadata.ts        # File type detection, metadata, existence/readability checks
│   ├── reader.ts          # Chunked reading, line-range reading, line navigation
│   ├── search.ts          # Regex/plain-text pattern search with context lines
│   ├── analysis.ts        # File structure and content statistics
│   └── stream.ts          # Byte-based streaming of large files
├── cacheManager.ts        # LRU + TTL cache
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
