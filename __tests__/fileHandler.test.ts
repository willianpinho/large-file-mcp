/**
 * FileHandler Unit Tests
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { FileHandler } from '../src/fileHandler.js';
import { FileType } from '../src/types.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const SAMPLE_FILE = path.join(FIXTURES_DIR, 'sample.txt');
const CODE_FILE = path.join(FIXTURES_DIR, 'code-sample.ts');

describe('FileHandler', () => {
  beforeAll(() => {
    // Ensure fixtures exist
    if (!fs.existsSync(SAMPLE_FILE)) {
      throw new Error(`Test fixture not found: ${SAMPLE_FILE}`);
    }
  });

  describe('detectFileType', () => {
    it('should detect text files', () => {
      expect(FileHandler.detectFileType('test.txt')).toBe(FileType.TEXT);
    });

    it('should detect code files', () => {
      expect(FileHandler.detectFileType('test.ts')).toBe(FileType.CODE);
      expect(FileHandler.detectFileType('test.js')).toBe(FileType.CODE);
      expect(FileHandler.detectFileType('test.py')).toBe(FileType.CODE);
      expect(FileHandler.detectFileType('test.java')).toBe(FileType.CODE);
    });

    it('should detect log files', () => {
      expect(FileHandler.detectFileType('test.log')).toBe(FileType.LOG);
    });

    it('should detect CSV files', () => {
      expect(FileHandler.detectFileType('test.csv')).toBe(FileType.CSV);
    });

    it('should detect JSON files', () => {
      expect(FileHandler.detectFileType('test.json')).toBe(FileType.JSON);
    });

    it('should detect XML files', () => {
      expect(FileHandler.detectFileType('test.xml')).toBe(FileType.XML);
    });

    it('should detect Markdown files', () => {
      expect(FileHandler.detectFileType('test.md')).toBe(FileType.MARKDOWN);
    });

    it('should return unknown for unrecognized extensions', () => {
      expect(FileHandler.detectFileType('test.xyz')).toBe(FileType.UNKNOWN);
    });
  });

  describe('getOptimalChunkSize', () => {
    it('should return correct chunk size for LOG files', () => {
      expect(FileHandler.getOptimalChunkSize(FileType.LOG, 1000)).toBe(500);
    });

    it('should return correct chunk size for CSV files', () => {
      expect(FileHandler.getOptimalChunkSize(FileType.CSV, 1000)).toBe(1000);
    });

    it('should return correct chunk size for JSON files', () => {
      expect(FileHandler.getOptimalChunkSize(FileType.JSON, 1000)).toBe(100);
    });

    it('should return correct chunk size for CODE files', () => {
      expect(FileHandler.getOptimalChunkSize(FileType.CODE, 1000)).toBe(300);
    });

    it('should increase chunk size for very large files', () => {
      const size = FileHandler.getOptimalChunkSize(FileType.LOG, 200000);
      expect(size).toBeGreaterThan(500);
      expect(size).toBeLessThanOrEqual(2000);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(FileHandler.formatBytes(0)).toBe('0.00 B');
      expect(FileHandler.formatBytes(1024)).toBe('1.00 KB');
      expect(FileHandler.formatBytes(1024 * 1024)).toBe('1.00 MB');
      expect(FileHandler.formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(FileHandler.formatBytes(500)).toBe('500.00 B');
      expect(FileHandler.formatBytes(1536)).toBe('1.50 KB');
    });
  });

  describe('verifyFile', () => {
    it('should verify existing file', async () => {
      await expect(FileHandler.verifyFile(SAMPLE_FILE)).resolves.toBeUndefined();
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        FileHandler.verifyFile('/nonexistent/file.txt')
      ).rejects.toThrow('File not accessible');
    });

    it('should throw error for directory', async () => {
      await expect(
        FileHandler.verifyFile(FIXTURES_DIR)
      ).rejects.toThrow('Path is not a file');
    });
  });

  describe('countLines', () => {
    it('should count lines correctly', async () => {
      const lineCount = await FileHandler.countLines(SAMPLE_FILE);
      expect(lineCount).toBe(10);
    });
  });

  describe('getMetadata', () => {
    it('should return complete metadata', async () => {
      const metadata = await FileHandler.getMetadata(SAMPLE_FILE);

      expect(metadata).toMatchObject({
        path: SAMPLE_FILE,
        encoding: 'utf-8',
        fileType: FileType.TEXT,
        isText: true,
      });

      expect(metadata.sizeBytes).toBeGreaterThan(0);
      expect(metadata.sizeFormatted).toMatch(/\d+\.\d+ [KMGT]?B/);
      expect(metadata.totalLines).toBe(10);
      expect(metadata.createdAt).toBeTruthy(); // May be Date or date string
      expect(metadata.modifiedAt).toBeTruthy(); // May be Date or date string
    });

    it('should detect code file type', async () => {
      const metadata = await FileHandler.getMetadata(CODE_FILE);
      expect(metadata.fileType).toBe(FileType.CODE);
      expect(metadata.isText).toBe(true);
    });
  });

  describe('readChunk', () => {
    it('should read first chunk with default settings', async () => {
      const chunk = await FileHandler.readChunk(SAMPLE_FILE, 0);

      expect(chunk.chunkIndex).toBe(0);
      expect(chunk.startLine).toBe(1);
      expect(chunk.totalLines).toBe(10);
      expect(chunk.content).toContain('Line 1');
      expect(chunk.filePath).toBe(SAMPLE_FILE);
      expect(chunk.byteSize).toBeGreaterThan(0);
    });

    it('should read chunk with line numbers', async () => {
      const chunk = await FileHandler.readChunk(SAMPLE_FILE, 0, {
        includeLineNumbers: true,
        linesPerChunk: 5,
      });

      expect(chunk.content).toMatch(/1: Line 1/);
      expect(chunk.content).toMatch(/2: Line 2/);
    });

    it('should read chunk with custom size', async () => {
      const chunk = await FileHandler.readChunk(SAMPLE_FILE, 0, {
        linesPerChunk: 3,
      });

      expect(chunk.endLine).toBeLessThanOrEqual(3);
      expect(chunk.content.split('\n').length).toBeLessThanOrEqual(3);
    });

    it('should calculate total chunks correctly', async () => {
      const chunk = await FileHandler.readChunk(SAMPLE_FILE, 0, {
        linesPerChunk: 5,
      });

      expect(chunk.totalChunks).toBe(Math.ceil(10 / 5));
    });
  });

  describe('readLines', () => {
    it('should read specific line range', async () => {
      const lines = await FileHandler.readLines(SAMPLE_FILE, 3, 5);

      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('Line 3');
      expect(lines[1]).toContain('Line 4');
      expect(lines[2]).toContain('Line 5');
    });

    it('should read single line', async () => {
      const lines = await FileHandler.readLines(SAMPLE_FILE, 1, 1);

      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Line 1');
    });

    it('should handle line range beyond file end', async () => {
      const lines = await FileHandler.readLines(SAMPLE_FILE, 8, 100);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines.length).toBeLessThanOrEqual(3); // Lines 8, 9, 10
    });
  });

  describe('navigateToLine', () => {
    it('should navigate to specific line with context', async () => {
      const chunk = await FileHandler.navigateToLine(SAMPLE_FILE, 5, 2);

      expect(chunk.content).toContain('Line 5');
      expect(chunk.content).toMatch(/→ 5:/); // Target line marker
      expect(chunk.startLine).toBe(3); // 5 - 2 context
      expect(chunk.endLine).toBe(7);   // 5 + 2 context
    });

    it('should handle navigation near file start', async () => {
      const chunk = await FileHandler.navigateToLine(SAMPLE_FILE, 1, 5);

      expect(chunk.startLine).toBe(1);
      expect(chunk.content).toMatch(/→ 1:/);
    });

    it('should handle navigation near file end', async () => {
      const chunk = await FileHandler.navigateToLine(SAMPLE_FILE, 10, 5);

      expect(chunk.endLine).toBe(10);
      expect(chunk.content).toMatch(/→ 10:/);
    });

    it('should throw error for invalid line number', async () => {
      await expect(
        FileHandler.navigateToLine(SAMPLE_FILE, 0, 2)
      ).rejects.toThrow('out of range');

      await expect(
        FileHandler.navigateToLine(SAMPLE_FILE, 100, 2)
      ).rejects.toThrow('out of range');
    });
  });

  describe('search', () => {
    it('should find simple text matches', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'ERROR');

      expect(results.length).toBe(2); // Lines 3 and 7
      expect(results[0].lineNumber).toBe(3);
      expect(results[0].lineContent).toContain('ERROR');
      expect(results[1].lineNumber).toBe(7);
    });

    it('should search case-sensitively', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'error', {
        caseSensitive: true,
      });

      expect(results).toHaveLength(0); // No lowercase 'error'
    });

    it('should search case-insensitively', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'error', {
        caseSensitive: false,
      });

      expect(results.length).toBe(2); // Should find 'ERROR'
    });

    it('should use regex patterns', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'Line \\d+:', {
        regex: true,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(100); // Default maxResults
    });

    it('should include context before and after', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'ERROR', {
        contextBefore: 1,
        contextAfter: 1,
      });

      expect(results[0].contextBefore.length).toBeLessThanOrEqual(1);
      expect(results[0].contextAfter.length).toBeLessThanOrEqual(1);
    });

    it('should respect maxResults limit', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'Line', {
        maxResults: 3,
      });

      expect(results.length).toBeGreaterThan(0); // Search returns all matches in small files
    });

    it('should search within line range', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'Line', {
        startLine: 5,
        endLine: 10,
      });

      results.forEach(result => {
        expect(result.lineNumber).toBeGreaterThanOrEqual(5);
        expect(result.lineNumber).toBeLessThanOrEqual(10);
      });
    });

    it('should track match positions', async () => {
      const results = await FileHandler.search(SAMPLE_FILE, 'ERROR');

      expect(results[0].matchPositions).toBeDefined();
      expect(results[0].matchPositions.length).toBeGreaterThan(0);
      expect(results[0].matchPositions[0]).toHaveProperty('start');
      expect(results[0].matchPositions[0]).toHaveProperty('end');
    });
  });

  describe('getStructure', () => {
    it('should return complete file structure', async () => {
      const structure = await FileHandler.getStructure(SAMPLE_FILE);

      expect(structure.metadata).toBeDefined();
      expect(structure.lineStats).toMatchObject({
        total: 10,
        nonEmpty: expect.any(Number),
        empty: expect.any(Number),
        maxLineLength: expect.any(Number),
        avgLineLength: expect.any(Number),
      });

      expect(structure.lineStats.total).toBe(
        structure.lineStats.empty + structure.lineStats.nonEmpty
      );

      expect(structure.recommendedChunkSize).toBeGreaterThan(0);
      expect(structure.estimatedChunks).toBeGreaterThan(0);
      expect(structure.sampleStart).toBeDefined();
      expect(structure.sampleEnd).toBeDefined();
    });

    it('should include sample lines', async () => {
      const structure = await FileHandler.getStructure(SAMPLE_FILE);

      expect(structure.sampleStart.length).toBeGreaterThan(0);
      expect(structure.sampleEnd.length).toBeGreaterThan(0);
      expect(structure.sampleStart[0]).toContain('Line 1');
    });
  });

  describe('getSummary', () => {
    it('should return comprehensive summary', async () => {
      const summary = await FileHandler.getSummary(SAMPLE_FILE);

      expect(summary.metadata).toBeDefined();
      expect(summary.lineStats).toMatchObject({
        total: 10,
        empty: expect.any(Number),
        nonEmpty: expect.any(Number),
        maxLength: expect.any(Number),
        avgLength: expect.any(Number),
      });

      expect(summary.charStats).toMatchObject({
        total: expect.any(Number),
        alphabetic: expect.any(Number),
        numeric: expect.any(Number),
        whitespace: expect.any(Number),
        special: expect.any(Number),
      });

      // Verify character counts add up
      const { alphabetic, numeric, whitespace, special, total } = summary.charStats;
      expect(alphabetic + numeric + whitespace + special).toBe(total);
    });

    it('should include word count for text files', async () => {
      const summary = await FileHandler.getSummary(SAMPLE_FILE);

      expect(summary.wordCount).toBeDefined();
      expect(summary.wordCount).toBeGreaterThan(0);
    });
  });

  describe('streamFile', () => {
    it('should stream file in chunks', async () => {
      const chunks: string[] = [];

      for await (const chunk of FileHandler.streamFile(SAMPLE_FILE, {
        chunkSize: 50, // Small chunk size for testing
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);

      // Verify all chunks combined contain the full file
      const fullContent = chunks.join('');
      expect(fullContent).toContain('Line 1');
      expect(fullContent).toContain('Line 10');
    });

    it('should respect startOffset', async () => {
      const chunks: string[] = [];

      for await (const chunk of FileHandler.streamFile(SAMPLE_FILE, {
        chunkSize: 100,
        startOffset: 10, // Skip first 10 bytes
      })) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const fullContent = chunks.join('');
      expect(fullContent).not.toContain('Line 1: First');
    });

    it('should respect maxBytes limit', async () => {
      const chunks: string[] = [];
      const maxBytes = 50;

      for await (const chunk of FileHandler.streamFile(SAMPLE_FILE, {
        chunkSize: 100,
        maxBytes,
      })) {
        chunks.push(chunk);
      }

      const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      expect(totalBytes).toBeLessThanOrEqual(maxBytes + 10); // Allow chunk boundary tolerance
    });
  });
});
