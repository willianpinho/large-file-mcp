# Best Practices

## Chunk Size Selection

- **Log files**: 500-1000 lines
- **Code files**: 200-400 lines
- **CSV files**: 1000-5000 lines
- **JSON files**: 50-200 lines

## Performance Tips

1. Enable caching for frequently accessed files
2. Use appropriate chunk sizes
3. Limit search results with `maxResults`
4. Use streaming for files > 1GB

## Memory Management

- Monitor cache usage
- Adjust `CACHE_SIZE` based on available RAM
- Disable caching for one-time operations

## Error Handling

- Always use absolute file paths
- Check file permissions
- Handle large search results gracefully

See [Configuration](/guide/configuration) for tuning details.
