# API Reference

## Overview

Large File MCP Server provides 6 powerful tools for handling large files:

| Tool | Purpose | Best For |
|------|---------|----------|
| [read_large_file_chunk](#read_large_file_chunk) | Read specific chunk | Sequential reading |
| [search_in_large_file](#search_in_large_file) | Search with regex | Finding patterns |
| [get_file_structure](#get_file_structure) | Analyze file | Understanding structure |
| [navigate_to_line](#navigate_to_line) | Jump to line | Code navigation |
| [get_file_summary](#get_file_summary) | Get statistics | File analysis |
| [stream_large_file](#stream_large_file) | Stream chunks | Very large files |

## read_large_file_chunk

Read a specific chunk of a large file with intelligent chunking.

### Parameters

- **filePath** (required): `string`
  - Absolute path to the file
- **chunkIndex** (optional): `number`
  - Zero-based chunk index (default: 0)
- **linesPerChunk** (optional): `number`
  - Lines per chunk (auto-detected if not provided)
- **includeLineNumbers** (optional): `boolean`
  - Include line numbers in output (default: false)

### Returns

```typescript
{
  content: string;          // Chunk content
  startLine: number;        // Starting line number (1-indexed)
  endLine: number;          // Ending line number (1-indexed)
  totalLines: number;       // Total lines in file
  chunkIndex: number;       // Current chunk index
  totalChunks: number;      // Total number of chunks
  filePath: string;         // File path
  byteOffset: number;       // Byte offset
  byteSize: number;         // Chunk size in bytes
}
```

### Example

```json
{
  "filePath": "/var/log/system.log",
  "chunkIndex": 0,
  "includeLineNumbers": true
}
```

## search_in_large_file

Search for patterns in large files with context lines.

### Parameters

- **filePath** (required): `string`
- **pattern** (required): `string` - Search pattern
- **caseSensitive** (optional): `boolean` - Case sensitive (default: false)
- **regex** (optional): `boolean` - Use regex (default: false)
- **maxResults** (optional): `number` - Max results (default: 100)
- **contextBefore** (optional): `number` - Context lines before (default: 2)
- **contextAfter** (optional): `number` - Context lines after (default: 2)
- **startLine** (optional): `number` - Start line
- **endLine** (optional): `number` - End line

### Returns

```typescript
{
  totalResults: number;
  results: Array<{
    lineNumber: number;
    lineContent: string;
    matchPositions: Array<{ start: number; end: number }>;
    contextBefore: string[];
    contextAfter: string[];
    chunkIndex: number;
  }>;
}
```

## get_file_structure

Analyze file structure and get comprehensive metadata.

### Parameters

- **filePath** (required): `string`

### Returns

Complete file metadata, line statistics, recommended chunk size, and sample lines.

## navigate_to_line

Jump to a specific line with surrounding context.

### Parameters

- **filePath** (required): `string`
- **lineNumber** (required): `number` - Line to navigate to (1-indexed)
- **contextLines** (optional): `number` - Context lines before/after (default: 5)

## get_file_summary

Get comprehensive statistical summary of a file.

### Parameters

- **filePath** (required): `string`

### Returns

File metadata, line statistics, character statistics, and word count.

## stream_large_file

Stream a file in chunks for processing very large files.

### Parameters

- **filePath** (required): `string`
- **chunkSize** (optional): `number` - Chunk size in bytes (default: 64KB)
- **startOffset** (optional): `number` - Starting byte offset (default: 0)
- **maxBytes** (optional): `number` - Maximum bytes to stream
- **maxChunks** (optional): `number` - Maximum chunks to return (default: 10)

For detailed documentation of each tool, see the individual pages.
