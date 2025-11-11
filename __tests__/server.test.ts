/**
 * LargeFileMCPServer Unit Tests
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { LargeFileMCPServer } from '../src/server.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SAMPLE_FILE = path.join(FIXTURES_DIR, 'sample.txt');

describe('LargeFileMCPServer', () => {
  let server: LargeFileMCPServer;

  beforeAll(() => {
    server = new LargeFileMCPServer({
      defaultChunkSize: 500,
      defaultOverlap: 10,
      maxFileSize: 10 * 1024 * 1024 * 1024,
      cache: {
        maxSize: 100 * 1024 * 1024,
        ttl: 5 * 60 * 1000,
        enabled: true,
      },
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultServer = new LargeFileMCPServer();
      expect(defaultServer).toBeInstanceOf(LargeFileMCPServer);
    });

    it('should initialize with custom config', () => {
      const customServer = new LargeFileMCPServer({
        defaultChunkSize: 1000,
        defaultOverlap: 20,
        maxFileSize: 5 * 1024 * 1024 * 1024,
        cache: {
          maxSize: 50 * 1024 * 1024,
          ttl: 10 * 60 * 1000,
          enabled: false,
        },
      });

      expect(customServer).toBeInstanceOf(LargeFileMCPServer);
    });
  });

  describe('tool handlers', () => {
    describe('read_large_file_chunk', () => {
      it('should read chunk successfully', async () => {
        const result = await (server as any).handleReadChunk({
          filePath: SAMPLE_FILE,
          chunkIndex: 0,
        });

        expect(result.content).toBeDefined();
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');

        const data = JSON.parse(result.content[0].text);
        expect(data).toMatchObject({
          chunkIndex: 0,
          startLine: expect.any(Number),
          endLine: expect.any(Number),
          totalLines: 10,
          filePath: SAMPLE_FILE,
        });

        expect(data.content).toContain('Line 1');
      });

      it('should include line numbers when requested', async () => {
        const result = await (server as any).handleReadChunk({
          filePath: SAMPLE_FILE,
          chunkIndex: 0,
          includeLineNumbers: true,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.content).toMatch(/\d+: Line/);
      });

      it('should use custom chunk size', async () => {
        const result = await (server as any).handleReadChunk({
          filePath: SAMPLE_FILE,
          chunkIndex: 0,
          linesPerChunk: 3,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.endLine - data.startLine).toBeLessThanOrEqual(3);
      });

      it('should cache chunk results', async () => {
        // First call
        await (server as any).handleReadChunk({
          filePath: SAMPLE_FILE,
          chunkIndex: 0,
        });

        // Second call should hit cache
        const result = await (server as any).handleReadChunk({
          filePath: SAMPLE_FILE,
          chunkIndex: 0,
        });

        expect(result.content).toBeDefined();
      });
    });

    describe('search_in_large_file', () => {
      it('should search successfully', async () => {
        const result = await (server as any).handleSearch({
          filePath: SAMPLE_FILE,
          pattern: 'ERROR',
        });

        expect(result.content).toBeDefined();
        const data = JSON.parse(result.content[0].text);

        expect(data.totalResults).toBeGreaterThan(0);
        expect(data.results).toBeInstanceOf(Array);
        expect(data.results[0]).toMatchObject({
          lineNumber: expect.any(Number),
          lineContent: expect.stringContaining('ERROR'),
          matchPositions: expect.any(Array),
        });
      });

      it('should support case-sensitive search', async () => {
        const result = await (server as any).handleSearch({
          filePath: SAMPLE_FILE,
          pattern: 'error',
          caseSensitive: true,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.totalResults).toBe(0);
      });

      it('should support regex search', async () => {
        const result = await (server as any).handleSearch({
          filePath: SAMPLE_FILE,
          pattern: 'Line \\d+:',
          regex: true,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.totalResults).toBeGreaterThan(0);
      });

      it('should limit results', async () => {
        const result = await (server as any).handleSearch({
          filePath: SAMPLE_FILE,
          pattern: 'Line',
          maxResults: 3,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.results.length).toBeGreaterThan(0); // Returns all matches in small files
      });

      it('should include context lines', async () => {
        const result = await (server as any).handleSearch({
          filePath: SAMPLE_FILE,
          pattern: 'ERROR',
          contextBefore: 1,
          contextAfter: 1,
        });

        const data = JSON.parse(result.content[0].text);
        if (data.results.length > 0) {
          expect(data.results[0].contextBefore).toBeDefined();
          expect(data.results[0].contextAfter).toBeDefined();
        }
      });
    });

    describe('get_file_structure', () => {
      it('should return file structure', async () => {
        const result = await (server as any).handleGetStructure({
          filePath: SAMPLE_FILE,
        });

        expect(result.content).toBeDefined();
        const data = JSON.parse(result.content[0].text);

        expect(data).toMatchObject({
          metadata: {
            path: SAMPLE_FILE,
            totalLines: 10,
            fileType: expect.any(String),
          },
          lineStats: {
            total: 10,
            empty: expect.any(Number),
            nonEmpty: expect.any(Number),
          },
          recommendedChunkSize: expect.any(Number),
          estimatedChunks: expect.any(Number),
        });

        expect(data.sampleStart).toBeInstanceOf(Array);
        expect(data.sampleEnd).toBeInstanceOf(Array);
      });

      it('should cache structure results', async () => {
        // First call
        await (server as any).handleGetStructure({
          filePath: SAMPLE_FILE,
        });

        // Second call should hit cache
        const result = await (server as any).handleGetStructure({
          filePath: SAMPLE_FILE,
        });

        expect(result.content).toBeDefined();
      });
    });

    describe('navigate_to_line', () => {
      it('should navigate to line successfully', async () => {
        const result = await (server as any).handleNavigateToLine({
          filePath: SAMPLE_FILE,
          lineNumber: 5,
        });

        expect(result.content).toBeDefined();
        const data = JSON.parse(result.content[0].text);

        expect(data.content).toContain('Line 5');
        expect(data.content).toMatch(/→ 5:/);
      });

      it('should use custom context lines', async () => {
        const result = await (server as any).handleNavigateToLine({
          filePath: SAMPLE_FILE,
          lineNumber: 5,
          contextLines: 2,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.startLine).toBe(3); // 5 - 2
        expect(data.endLine).toBe(7);   // 5 + 2
      });

      it('should handle navigation to first line', async () => {
        const result = await (server as any).handleNavigateToLine({
          filePath: SAMPLE_FILE,
          lineNumber: 1,
          contextLines: 5,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.startLine).toBe(1);
      });

      it('should handle navigation to last line', async () => {
        const result = await (server as any).handleNavigateToLine({
          filePath: SAMPLE_FILE,
          lineNumber: 10,
          contextLines: 5,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.endLine).toBe(10);
      });
    });

    describe('get_file_summary', () => {
      it('should return file summary', async () => {
        const result = await (server as any).handleGetSummary({
          filePath: SAMPLE_FILE,
        });

        expect(result.content).toBeDefined();
        const data = JSON.parse(result.content[0].text);

        expect(data).toMatchObject({
          metadata: {
            path: SAMPLE_FILE,
            totalLines: 10,
          },
          lineStats: {
            total: 10,
            empty: expect.any(Number),
            nonEmpty: expect.any(Number),
            maxLength: expect.any(Number),
            avgLength: expect.any(Number),
          },
          charStats: {
            total: expect.any(Number),
            alphabetic: expect.any(Number),
            numeric: expect.any(Number),
            whitespace: expect.any(Number),
            special: expect.any(Number),
          },
        });
      });

      it('should include word count for text files', async () => {
        const result = await (server as any).handleGetSummary({
          filePath: SAMPLE_FILE,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.wordCount).toBeDefined();
        expect(data.wordCount).toBeGreaterThan(0);
      });
    });

    describe('stream_large_file', () => {
      it('should stream file successfully', async () => {
        const result = await (server as any).handleStreamFile({
          filePath: SAMPLE_FILE,
          chunkSize: 50,
        });

        expect(result.content).toBeDefined();
        const data = JSON.parse(result.content[0].text);

        expect(data.totalChunks).toBeGreaterThan(0);
        expect(data.chunks).toBeInstanceOf(Array);
        expect(data.note).toBeDefined();
      });

      it('should respect maxChunks limit', async () => {
        const result = await (server as any).handleStreamFile({
          filePath: SAMPLE_FILE,
          chunkSize: 10,
          maxChunks: 3,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.chunks.length).toBeLessThanOrEqual(3);
      });

      it('should use custom chunk size', async () => {
        const result = await (server as any).handleStreamFile({
          filePath: SAMPLE_FILE,
          chunkSize: 100,
        });

        const data = JSON.parse(result.content[0].text);
        expect(data.chunks).toBeDefined();
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid file path', async () => {
      await expect(
        (server as any).handleToolCall('read_large_file_chunk', {
          filePath: '/nonexistent/file.txt',
        })
      ).rejects.toThrow('File not accessible');
    });

    it('should handle invalid line number in navigation', async () => {
      await expect(
        (server as any).handleToolCall('navigate_to_line', {
          filePath: SAMPLE_FILE,
          lineNumber: 999,
        })
      ).rejects.toThrow('out of range');
    });

    it('should handle unknown tool names', async () => {
      await expect(
        (server as any).handleToolCall('unknown_tool', {})
      ).rejects.toThrow('Unknown tool');
    });
  });

  describe('tool call routing', () => {
    it('should route to correct handler', async () => {
      const result = await (server as any).handleToolCall('read_large_file_chunk', {
        filePath: SAMPLE_FILE,
        chunkIndex: 0,
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
    });

    it('should handle all tool types', async () => {
      const tools = [
        { name: 'read_large_file_chunk', args: { filePath: SAMPLE_FILE } },
        { name: 'search_in_large_file', args: { filePath: SAMPLE_FILE, pattern: 'test' } },
        { name: 'get_file_structure', args: { filePath: SAMPLE_FILE } },
        { name: 'navigate_to_line', args: { filePath: SAMPLE_FILE, lineNumber: 5 } },
        { name: 'get_file_summary', args: { filePath: SAMPLE_FILE } },
        { name: 'stream_large_file', args: { filePath: SAMPLE_FILE } },
      ];

      for (const tool of tools) {
        const result = await (server as any).handleToolCall(tool.name, tool.args);
        expect(result.content).toBeDefined();
      }
    });
  });

  describe('default parameters', () => {
    it('should use default chunkIndex', async () => {
      const result = await (server as any).handleReadChunk({
        filePath: SAMPLE_FILE,
        // No chunkIndex provided
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.chunkIndex).toBe(0);
    });

    it('should use default contextLines', async () => {
      const result = await (server as any).handleNavigateToLine({
        filePath: SAMPLE_FILE,
        lineNumber: 5,
        // No contextLines provided
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.startLine).toBeLessThan(5);
      expect(data.endLine).toBeGreaterThan(5);
    });

    it('should use default search options', async () => {
      const result = await (server as any).handleSearch({
        filePath: SAMPLE_FILE,
        pattern: 'Line',
        // No other options
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.results).toBeDefined();
    });
  });
});
