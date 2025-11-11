# Configuration

## Environment Variables

Customize Large File MCP Server behavior using environment variables:

| Variable | Description | Default | Type |
|----------|-------------|---------|------|
| `CHUNK_SIZE` | Default lines per chunk | 500 | number |
| `OVERLAP_LINES` | Overlap between chunks | 10 | number |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | 10GB | number |
| `CACHE_SIZE` | Cache size (bytes) | 100MB | number |
| `CACHE_TTL` | Cache TTL (milliseconds) | 5 minutes | number |
| `CACHE_ENABLED` | Enable/disable caching | true | boolean |

## Configuration Examples

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "large-file": {
      "command": "npx",
      "args": ["-y", "@willianpinho/large-file-mcp"],
      "env": {
        "CHUNK_SIZE": "1000",
        "OVERLAP_LINES": "20",
        "CACHE_SIZE": "209715200",
        "CACHE_TTL": "600000",
        "CACHE_ENABLED": "true"
      }
    }
  }
}
```

### Claude Code CLI Configuration

```bash
claude mcp add --transport stdio --scope user large-file-mcp \
  --env CHUNK_SIZE=1000 \
  --env OVERLAP_LINES=20 \
  --env CACHE_SIZE=209715200 \
  --env CACHE_TTL=600000 \
  --env CACHE_ENABLED=true \
  -- npx -y @willianpinho/large-file-mcp
```

## Tuning Recommendations

### For Log Files

```json
{
  "env": {
    "CHUNK_SIZE": "500",
    "CACHE_ENABLED": "true",
    "CACHE_TTL": "300000"
  }
}
```

Best for: Analyzing rotating log files with frequent access.

### For Large CSV Files

```json
{
  "env": {
    "CHUNK_SIZE": "1000",
    "OVERLAP_LINES": "1",
    "CACHE_SIZE": "524288000"
  }
}
```

Best for: Processing large datasets with sequential access.

### For Code Navigation

```json
{
  "env": {
    "CHUNK_SIZE": "300",
    "OVERLAP_LINES": "15",
    "CACHE_ENABLED": "true"
  }
}
```

Best for: Navigating large codebases with context.

### For Memory-Constrained Systems

```json
{
  "env": {
    "CHUNK_SIZE": "200",
    "CACHE_SIZE": "52428800",
    "CACHE_ENABLED": "true"
  }
}
```

Best for: Systems with limited RAM.

### For High-Performance Systems

```json
{
  "env": {
    "CHUNK_SIZE": "2000",
    "CACHE_SIZE": "1073741824",
    "CACHE_TTL": "1800000"
  }
}
```

Best for: Servers with ample RAM and high throughput needs.

## Cache Configuration

### Understanding Cache Behavior

The LRU (Least Recently Used) cache stores:
- File chunks (from `read_large_file_chunk`)
- File metadata (from `get_file_structure`)

Cache entries are evicted when:
- TTL expires (default 5 minutes)
- Cache size limit is reached
- Manually cleared

### Cache Statistics

Monitor cache performance:
- Hit rate: 80-90% for typical workloads
- Memory usage: Tracks current usage vs. max size
- Utilization percentage: (current / max) * 100

### Disabling Cache

Disable caching for specific scenarios:

```json
{
  "env": {
    "CACHE_ENABLED": "false"
  }
}
```

When to disable:
- One-time file processing
- Memory-critical environments
- Files change frequently

## Performance Tuning

### Chunk Size Guidelines

| File Type | Recommended Size | Reasoning |
|-----------|------------------|-----------|
| Logs | 500-1000 | Balance context and performance |
| Code | 200-400 | Preserve function context |
| CSV | 1000-5000 | Data rows are typically small |
| JSON | 50-200 | JSON objects can be large |
| Text | 500-1000 | General purpose |

### Memory Usage Estimation

Approximate memory usage:

```
Memory = (CACHE_SIZE) + (Active chunk size * concurrent operations)

Example:
CACHE_SIZE = 100MB
CHUNK_SIZE = 500 lines
Average line = 100 bytes
Concurrent ops = 3

Memory ≈ 100MB + (500 * 100 * 3) = ~100.15MB
```

## Troubleshooting

### Out of Memory

Reduce `CACHE_SIZE` and `CHUNK_SIZE`:

```json
{
  "env": {
    "CHUNK_SIZE": "200",
    "CACHE_SIZE": "52428800"
  }
}
```

### Slow Performance

Increase `CACHE_SIZE` and enable caching:

```json
{
  "env": {
    "CACHE_SIZE": "524288000",
    "CACHE_ENABLED": "true",
    "CACHE_TTL": "600000"
  }
}
```

### Files Not Found

Ensure absolute paths are used:

```typescript
// Correct
filePath: "/Users/username/project/file.log"

// Incorrect
filePath: "~/project/file.log"
filePath: "./file.log"
```

## Next Steps

- [Usage Guide](/guide/usage) - Learn how to use the tools
- [Best Practices](/guide/best-practices) - Optimization tips
- [Performance](/guide/performance) - Performance tuning
