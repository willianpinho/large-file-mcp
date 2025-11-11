# Performance

## Benchmarks

| File Size | Operation | Time | Method |
|-----------|-----------|------|--------|
| < 1MB     | Read | < 100ms | Direct |
| 1-100MB   | Search | < 500ms | Streaming |
| > 1GB     | Stream | Progressive | Async |

## Optimization

- Use caching for repeated access
- Adjust chunk sizes based on file type
- Enable LRU cache for best performance

## Monitoring

Track performance using cache statistics and operation timing.

See [Configuration](/guide/configuration) for tuning options.
