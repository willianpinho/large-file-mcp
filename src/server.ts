/**
 * MCP Server for Large File Handling
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { FileHandler } from './fileHandler.js';
import { CacheManager } from './cacheManager.js';
import {
  ServerConfig,
  FileChunk,
  FileStructure,
  SearchResult,
  FileSummary,
} from './types.js';

export class LargeFileMCPServer {
  private server: Server;
  private chunkCache: CacheManager<FileChunk>;
  private metadataCache: CacheManager<FileStructure>;
  private config: ServerConfig;

  constructor(config?: Partial<ServerConfig>) {
    this.config = {
      defaultChunkSize: 500,
      defaultOverlap: 10,
      maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
      defaultEncoding: 'utf-8',
      defaultContextLines: 5,
      cache: {
        maxSize: 100 * 1024 * 1024, // 100MB
        ttl: 5 * 60 * 1000, // 5 minutes
        enabled: true,
      },
      ...config,
    };

    this.chunkCache = new CacheManager<FileChunk>(this.config.cache);
    this.metadataCache = new CacheManager<FileStructure>(this.config.cache);

    this.server = new Server(
      {
        name: 'large-file-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: this.getTools(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.handleToolCall(request.params.name, request.params.arguments ?? {});
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                code: 'TOOL_EXECUTION_ERROR',
              }, null, 2),
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'read_large_file_chunk',
        description: 'Read a specific chunk of a large file with intelligent chunking based on file type. Automatically determines optimal chunk size.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
            chunkIndex: {
              type: 'number',
              description: 'Zero-based chunk index to read (default: 0)',
            },
            linesPerChunk: {
              type: 'number',
              description: 'Number of lines per chunk (optional, auto-detected if not provided)',
            },
            includeLineNumbers: {
              type: 'boolean',
              description: 'Include line numbers in output (default: false)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'search_in_large_file',
        description: 'Search for a pattern in a large file with context lines. Supports regex and case-sensitive search.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
            pattern: {
              type: 'string',
              description: 'Search pattern (supports regex if regex=true)',
            },
            caseSensitive: {
              type: 'boolean',
              description: 'Case sensitive search (default: false)',
            },
            regex: {
              type: 'boolean',
              description: 'Use regex pattern (default: false)',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 100)',
            },
            contextBefore: {
              type: 'number',
              description: 'Number of context lines before match (default: 2)',
            },
            contextAfter: {
              type: 'number',
              description: 'Number of context lines after match (default: 2)',
            },
            startLine: {
              type: 'number',
              description: 'Start searching from line number (optional)',
            },
            endLine: {
              type: 'number',
              description: 'End searching at line number (optional)',
            },
          },
          required: ['filePath', 'pattern'],
        },
      },
      {
        name: 'get_file_structure',
        description: 'Analyze file structure and get comprehensive metadata including line statistics, recommended chunk size, and samples from start and end.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'navigate_to_line',
        description: 'Jump to a specific line in a large file with surrounding context lines. Highlights the target line.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
            lineNumber: {
              type: 'number',
              description: 'Line number to navigate to (1-indexed)',
            },
            contextLines: {
              type: 'number',
              description: 'Number of context lines before and after (default: 5)',
            },
          },
          required: ['filePath', 'lineNumber'],
        },
      },
      {
        name: 'get_file_summary',
        description: 'Get comprehensive statistical summary of a file including line stats, character stats, and word count.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'stream_large_file',
        description: 'Stream a large file in chunks. Returns multiple chunks for processing very large files efficiently.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Absolute path to the file',
            },
            chunkSize: {
              type: 'number',
              description: 'Chunk size in bytes (default: 65536 - 64KB)',
            },
            startOffset: {
              type: 'number',
              description: 'Starting byte offset (default: 0)',
            },
            maxBytes: {
              type: 'number',
              description: 'Maximum bytes to stream (optional)',
            },
            maxChunks: {
              type: 'number',
              description: 'Maximum number of chunks to return (default: 10)',
            },
          },
          required: ['filePath'],
        },
      },
    ];
  }

  private async handleToolCall(
    name: string,
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    switch (name) {
      case 'read_large_file_chunk':
        return this.handleReadChunk(args);
      case 'search_in_large_file':
        return this.handleSearch(args);
      case 'get_file_structure':
        return this.handleGetStructure(args);
      case 'navigate_to_line':
        return this.handleNavigateToLine(args);
      case 'get_file_summary':
        return this.handleGetSummary(args);
      case 'stream_large_file':
        return this.handleStreamFile(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleReadChunk(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;
    const chunkIndex = (args.chunkIndex as number) || 0;
    const linesPerChunk = args.linesPerChunk as number | undefined;
    const includeLineNumbers = (args.includeLineNumbers as boolean) || false;

    const cacheKey = `chunk:${filePath}:${chunkIndex}:${linesPerChunk}:${includeLineNumbers}`;
    let chunk = this.chunkCache.get(cacheKey);

    if (!chunk) {
      chunk = await FileHandler.readChunk(filePath, chunkIndex, {
        linesPerChunk,
        includeLineNumbers,
        overlapLines: this.config.defaultOverlap,
      });
      this.chunkCache.set(cacheKey, chunk);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chunk, null, 2),
        },
      ],
    };
  }

  private async handleSearch(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;
    const pattern = args.pattern as string;

    const results: SearchResult[] = await FileHandler.search(filePath, pattern, {
      caseSensitive: args.caseSensitive as boolean,
      regex: args.regex as boolean,
      maxResults: (args.maxResults as number) || 100,
      contextBefore: (args.contextBefore as number) || 2,
      contextAfter: (args.contextAfter as number) || 2,
      startLine: args.startLine as number | undefined,
      endLine: args.endLine as number | undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalResults: results.length,
            results,
          }, null, 2),
        },
      ],
    };
  }

  private async handleGetStructure(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;

    const cacheKey = `structure:${filePath}`;
    let structure = this.metadataCache.get(cacheKey);

    if (!structure) {
      structure = await FileHandler.getStructure(filePath);
      this.metadataCache.set(cacheKey, structure);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structure, null, 2),
        },
      ],
    };
  }

  private async handleNavigateToLine(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;
    const lineNumber = args.lineNumber as number;
    const contextLines = (args.contextLines as number) || this.config.defaultContextLines;

    const chunk = await FileHandler.navigateToLine(filePath, lineNumber, contextLines);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chunk, null, 2),
        },
      ],
    };
  }

  private async handleGetSummary(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;

    const summary: FileSummary = await FileHandler.getSummary(filePath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async handleStreamFile(
    args: Record<string, unknown>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const filePath = args.filePath as string;
    const chunkSize = (args.chunkSize as number) || 64 * 1024;
    const startOffset = args.startOffset as number | undefined;
    const maxBytes = args.maxBytes as number | undefined;
    const maxChunks = (args.maxChunks as number) || 10;

    const chunks: string[] = [];
    let chunkCount = 0;

    for await (const chunk of FileHandler.streamFile(filePath, {
      chunkSize,
      startOffset,
      maxBytes,
    })) {
      chunks.push(chunk);
      chunkCount++;
      if (chunkCount >= maxChunks) break;
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalChunks: chunks.length,
            chunks,
            note: chunks.length >= maxChunks
              ? 'Reached maxChunks limit. Increase maxChunks or use startOffset to continue.'
              : 'All chunks returned.',
          }, null, 2),
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Large File MCP Server running on stdio');
  }
}
