# Contributing to Large File MCP Server

Thank you for your interest in contributing to the Large File MCP Server!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/large-file-mcp.git
   cd large-file-mcp
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Building

```bash
npm run build    # Build once
npm run dev      # Watch mode for development
```

### Linting

```bash
npm run lint
```

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use async/await for asynchronous operations
- Handle errors appropriately

### Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server implementation
├── fileHandler.ts     # Core file operations
├── cacheManager.ts    # Caching logic
└── types.ts           # Type definitions
```

## Adding New Features

### New Tool

1. Add tool definition in `server.ts` `getTools()` method
2. Add handler method in `server.ts`
3. Implement core logic in `fileHandler.ts` if needed
4. Update README.md with documentation
5. Add usage examples

### New File Type Support

1. Add file extension mapping in `fileHandler.ts` `detectFileType()`
2. Add optimal chunk size in `getOptimalChunkSize()`
3. Update documentation

## Testing

Currently, the project uses manual testing with example files. To test:

1. Build the project:
   ```bash
   npm run build
   ```

2. Test with example files:
   ```bash
   # In one terminal, start the server
   node dist/index.js

   # Configure your AI CLI to use the server
   # Test each tool with various parameters
   ```

3. Test scenarios to cover:
   - Small files (<100 lines)
   - Medium files (100-10,000 lines)
   - Large files (>10,000 lines)
   - Different file types (text, code, logs, CSV, JSON)
   - Edge cases (empty files, single line, very long lines)
   - Error conditions (non-existent files, permissions issues)

## Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

5. Ensure your PR:
   - Has a clear description of changes
   - Updates documentation if needed
   - Follows existing code style
   - Builds without errors
   - Passes linting

## Code Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged

## Reporting Bugs

Use GitHub Issues to report bugs. Include:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Sample files if applicable (ensure no sensitive data)

## Feature Requests

Use GitHub Issues for feature requests. Include:

- Description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Examples of how it would work

## Questions

For questions, please:
- Check existing documentation
- Search existing GitHub Issues
- Create a new issue if needed

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment
- Follow the project's coding standards

Thank you for contributing!
