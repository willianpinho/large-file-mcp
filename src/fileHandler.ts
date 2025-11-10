/**
 * Core file handling with intelligent chunking and streaming
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';
import {
  FileChunk,
  FileMetadata,
  FileStructure,
  SearchResult,
  SearchOptions,
  ChunkOptions,
  StreamOptions,
  FileSummary,
  FileType
} from './types.js';

const stat = promisify(fs.stat);
const access = promisify(fs.access);

export class FileHandler {
  private static readonly SAMPLE_LINES = 10;

  /**
   * Detect file type based on extension and content
   */
  static detectFileType(filePath: string): FileType {
    const ext = path.extname(filePath).toLowerCase();

    const typeMap: Record<string, FileType> = {
      '.txt': FileType.TEXT,
      '.log': FileType.LOG,
      '.csv': FileType.CSV,
      '.json': FileType.JSON,
      '.xml': FileType.XML,
      '.md': FileType.MARKDOWN,
      '.ts': FileType.CODE,
      '.js': FileType.CODE,
      '.py': FileType.CODE,
      '.java': FileType.CODE,
      '.cpp': FileType.CODE,
      '.c': FileType.CODE,
      '.h': FileType.CODE,
      '.go': FileType.CODE,
      '.rs': FileType.CODE,
      '.rb': FileType.CODE,
      '.php': FileType.CODE,
      '.swift': FileType.CODE,
      '.kt': FileType.CODE,
      '.scala': FileType.CODE,
      '.sh': FileType.CODE,
      '.bash': FileType.CODE,
      '.yml': FileType.CODE,
      '.yaml': FileType.CODE,
    };

    return typeMap[ext] || FileType.UNKNOWN;
  }

  /**
   * Get optimal chunk size based on file type
   */
  static getOptimalChunkSize(fileType: FileType, totalLines: number): number {
    const baseSizes: Record<FileType, number> = {
      [FileType.LOG]: 500,
      [FileType.CSV]: 1000,
      [FileType.JSON]: 100,
      [FileType.CODE]: 300,
      [FileType.TEXT]: 500,
      [FileType.MARKDOWN]: 200,
      [FileType.XML]: 200,
      [FileType.BINARY]: 1000,
      [FileType.UNKNOWN]: 500,
    };

    const baseSize = baseSizes[fileType] || 500;

    // Adjust for very large files
    if (totalLines > 100000) {
      return Math.min(baseSize * 2, 2000);
    }

    return baseSize;
  }

  /**
   * Verify file exists and is readable
   */
  static async verifyFile(filePath: string): Promise<void> {
    try {
      await access(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error(`File not accessible: ${filePath}`);
    }

    const stats = await stat(filePath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }
  }

  /**
   * Get file metadata
   */
  static async getMetadata(filePath: string): Promise<FileMetadata> {
    await this.verifyFile(filePath);

    const stats = await stat(filePath);
    const fileType = this.detectFileType(filePath);

    return {
      path: filePath,
      sizeBytes: stats.size,
      sizeFormatted: this.formatBytes(stats.size),
      totalLines: await this.countLines(filePath),
      encoding: 'utf-8',
      fileType,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isText: this.isTextFile(fileType),
    };
  }

  /**
   * Check if file type is text-based
   */
  private static isTextFile(fileType: FileType): boolean {
    return fileType !== FileType.BINARY;
  }

  /**
   * Format bytes to human-readable format
   */
  static formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Count total lines in file efficiently
   */
  static async countLines(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      const stream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on('line', () => lineCount++);
      rl.on('close', () => resolve(lineCount));
      rl.on('error', reject);
    });
  }

  /**
   * Read specific chunk of file
   */
  static async readChunk(
    filePath: string,
    chunkIndex: number,
    options: ChunkOptions = {}
  ): Promise<FileChunk> {
    await this.verifyFile(filePath);

    const metadata = await this.getMetadata(filePath);
    const linesPerChunk = options.linesPerChunk ||
      this.getOptimalChunkSize(metadata.fileType, metadata.totalLines);
    const overlapLines = options.overlapLines || 10;

    const startLine = Math.max(1, chunkIndex * linesPerChunk - overlapLines + 1);
    const endLine = Math.min(metadata.totalLines, (chunkIndex + 1) * linesPerChunk);

    const lines = await this.readLines(filePath, startLine, endLine);
    const content = options.includeLineNumbers
      ? lines.map((line, idx) => `${startLine + idx}: ${line}`).join('\n')
      : lines.join('\n');

    const totalChunks = Math.ceil(metadata.totalLines / linesPerChunk);

    return {
      content,
      startLine,
      endLine,
      totalLines: metadata.totalLines,
      chunkIndex,
      totalChunks,
      filePath,
      byteOffset: 0, // Calculated if needed
      byteSize: Buffer.byteLength(content, 'utf-8'),
    };
  }

  /**
   * Read specific line range from file
   */
  static async readLines(
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const lines: string[] = [];
      let currentLine = 0;

      const stream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        currentLine++;
        if (currentLine >= startLine && currentLine <= endLine) {
          lines.push(line);
        }
        if (currentLine > endLine) {
          rl.close();
        }
      });

      rl.on('close', () => resolve(lines));
      rl.on('error', reject);
    });
  }

  /**
   * Navigate to specific line with context
   */
  static async navigateToLine(
    filePath: string,
    lineNumber: number,
    contextLines: number = 5
  ): Promise<FileChunk> {
    await this.verifyFile(filePath);

    const metadata = await this.getMetadata(filePath);

    if (lineNumber < 1 || lineNumber > metadata.totalLines) {
      throw new Error(`Line number ${lineNumber} out of range (1-${metadata.totalLines})`);
    }

    const startLine = Math.max(1, lineNumber - contextLines);
    const endLine = Math.min(metadata.totalLines, lineNumber + contextLines);

    const lines = await this.readLines(filePath, startLine, endLine);
    const content = lines
      .map((line, idx) => {
        const num = startLine + idx;
        const marker = num === lineNumber ? '→ ' : '  ';
        return `${marker}${num}: ${line}`;
      })
      .join('\n');

    return {
      content,
      startLine,
      endLine,
      totalLines: metadata.totalLines,
      chunkIndex: Math.floor((lineNumber - 1) / 500),
      totalChunks: Math.ceil(metadata.totalLines / 500),
      filePath,
      byteOffset: 0,
      byteSize: Buffer.byteLength(content, 'utf-8'),
    };
  }

  /**
   * Search for pattern in file
   */
  static async search(
    filePath: string,
    pattern: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    await this.verifyFile(filePath);

    const results: SearchResult[] = [];
    const maxResults = options.maxResults || 100;
    const contextBefore = options.contextBefore || 2;
    const contextAfter = options.contextAfter || 2;

    const regex = options.regex
      ? new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
      : new RegExp(
          pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          options.caseSensitive ? 'g' : 'gi'
        );

    return new Promise((resolve, reject) => {
      let lineNumber = 0;
      const lineBuffer: string[] = [];
      const stream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        lineNumber++;
        lineBuffer.push(line);

        // Keep buffer for context
        if (lineBuffer.length > contextBefore + contextAfter + 1) {
          lineBuffer.shift();
        }

        // Check if within search range
        if (options.startLine && lineNumber < options.startLine) return;
        if (options.endLine && lineNumber > options.endLine) {
          rl.close();
          return;
        }

        // Search for pattern
        const matches = Array.from(line.matchAll(regex));
        if (matches.length > 0) {
          const matchPositions = matches.map(m => ({
            start: m.index!,
            end: m.index! + m[0].length,
          }));

          const bufferIndex = lineBuffer.length - 1;
          const before = lineBuffer.slice(
            Math.max(0, bufferIndex - contextBefore),
            bufferIndex
          );

          results.push({
            lineNumber,
            lineContent: line,
            matchPositions,
            contextBefore: before,
            contextAfter: [], // Will be filled after
            chunkIndex: Math.floor((lineNumber - 1) / 500),
          });

          if (results.length >= maxResults) {
            rl.close();
          }
        }

        // Fill context after for previous results
        if (results.length > 0) {
          const lastResult = results[results.length - 1];
          const linesSince = lineNumber - lastResult.lineNumber;
          if (linesSince > 0 && linesSince <= contextAfter) {
            lastResult.contextAfter.push(line);
          }
        }
      });

      rl.on('close', () => resolve(results));
      rl.on('error', reject);
    });
  }

  /**
   * Get file structure and statistics
   */
  static async getStructure(filePath: string): Promise<FileStructure> {
    await this.verifyFile(filePath);

    const metadata = await this.getMetadata(filePath);

    let emptyLines = 0;
    let maxLineLength = 0;
    let totalLineLength = 0;
    const sampleStart: string[] = [];
    let lineCount = 0;
    const endBuffer: string[] = [];

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        lineCount++;

        if (line.trim() === '') emptyLines++;
        maxLineLength = Math.max(maxLineLength, line.length);
        totalLineLength += line.length;

        // Sample start
        if (sampleStart.length < this.SAMPLE_LINES) {
          sampleStart.push(line);
        }

        // Sample end (keep last N lines)
        endBuffer.push(line);
        if (endBuffer.length > this.SAMPLE_LINES) {
          endBuffer.shift();
        }
      });

      rl.on('close', () => {
        const recommendedChunkSize = this.getOptimalChunkSize(
          metadata.fileType,
          metadata.totalLines
        );

        resolve({
          metadata,
          lineStats: {
            total: metadata.totalLines,
            empty: emptyLines,
            nonEmpty: metadata.totalLines - emptyLines,
            maxLineLength,
            avgLineLength: lineCount > 0 ? Math.round(totalLineLength / lineCount) : 0,
          },
          recommendedChunkSize,
          estimatedChunks: Math.ceil(metadata.totalLines / recommendedChunkSize),
          sampleStart,
          sampleEnd: endBuffer,
        });
      });

      rl.on('error', reject);
    });
  }

  /**
   * Get comprehensive file summary
   */
  static async getSummary(filePath: string): Promise<FileSummary> {
    await this.verifyFile(filePath);

    const metadata = await this.getMetadata(filePath);

    let emptyLines = 0;
    let maxLength = 0;
    let totalLength = 0;
    let alphabetic = 0;
    let numeric = 0;
    let whitespace = 0;
    let special = 0;
    let wordCount = 0;

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        if (line.trim() === '') {
          emptyLines++;
        } else {
          wordCount += line.split(/\s+/).filter(w => w.length > 0).length;
        }

        maxLength = Math.max(maxLength, line.length);
        totalLength += line.length;

        // Character analysis
        for (const char of line) {
          if (/[a-zA-Z]/.test(char)) alphabetic++;
          else if (/\d/.test(char)) numeric++;
          else if (/\s/.test(char)) whitespace++;
          else special++;
        }
      });

      rl.on('close', () => {
        const total = alphabetic + numeric + whitespace + special;

        resolve({
          metadata,
          lineStats: {
            total: metadata.totalLines,
            empty: emptyLines,
            nonEmpty: metadata.totalLines - emptyLines,
            maxLength,
            avgLength: metadata.totalLines > 0
              ? Math.round(totalLength / metadata.totalLines)
              : 0,
          },
          charStats: {
            total,
            alphabetic,
            numeric,
            whitespace,
            special,
          },
          wordCount: metadata.fileType === FileType.TEXT ||
                     metadata.fileType === FileType.MARKDOWN
            ? wordCount
            : undefined,
        });
      });

      rl.on('error', reject);
    });
  }

  /**
   * Stream file in chunks
   */
  static async *streamFile(
    filePath: string,
    options: StreamOptions = {}
  ): AsyncGenerator<string> {
    await this.verifyFile(filePath);

    const chunkSize = options.chunkSize || 64 * 1024; // 64KB default
    const encoding = options.encoding || 'utf-8';

    const stream = fs.createReadStream(filePath, {
      encoding,
      start: options.startOffset,
      end: options.maxBytes ?
        (options.startOffset || 0) + options.maxBytes :
        undefined,
      highWaterMark: chunkSize,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
