# Contributing to Large File MCP Server

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run in development mode: `npm run dev`

## Code Style

- TypeScript strict mode enabled
- Follow existing code patterns
- Use async/await for asynchronous operations
- Add JSDoc comments for public APIs
- Ensure all code passes linting: `npm run lint`

## Project Structure

```
src/
├── index.ts        # Entry point
├── server.ts       # MCP server implementation
├── fileHandler.ts  # Core file operations
├── cacheManager.ts # Caching logic
└── types.ts        # Type definitions
```

## Pull Request Process

1. Create a feature branch from `master`
2. Make your changes with clear commit messages
3. Ensure code builds without errors: `npm run build`
4. Ensure linting passes: `npm run lint`
5. Update documentation if needed
6. Submit a pull request with a clear description

## Reporting Issues

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version)
- Sample files if applicable (without sensitive data)

## Feature Requests

For feature requests, describe:
- The use case and motivation
- Proposed implementation approach
- Examples of how it would work

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards others

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
