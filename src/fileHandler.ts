/**
 * Core file handling with intelligent chunking and streaming
 *
 * Public API barrel — implementation lives in ./file-handler/*.
 */

import {
  FileChunk,
  FileMetadata,
  FileStructure,
  SearchResult,
  SearchOptions,
  ChunkOptions,
  StreamOptions,
  FileSummary,
  FileType,
} from './types.js';
import * as metadata from './file-handler/metadata.js';
import { readChunk, readLines, navigateToLine } from './file-handler/reader.js';
import { search } from './file-handler/search.js';
import { getStructure, getSummary } from './file-handler/analysis.js';
import { streamFile } from './file-handler/stream.js';

export class FileHandler {
  static detectFileType(filePath: string): FileType {
    return metadata.detectFileType(filePath);
  }

  static getOptimalChunkSize(fileType: FileType, totalLines: number): number {
    return metadata.getOptimalChunkSize(fileType, totalLines);
  }

  static async verifyFile(filePath: string): Promise<void> {
    return metadata.verifyFile(filePath);
  }

  static async getMetadata(filePath: string): Promise<FileMetadata> {
    return metadata.getMetadata(filePath);
  }

  static formatBytes(bytes: number): string {
    return metadata.formatBytes(bytes);
  }

  static async countLines(filePath: string): Promise<number> {
    return metadata.countLines(filePath);
  }

  static async readChunk(
    filePath: string,
    chunkIndex: number,
    options: ChunkOptions = {}
  ): Promise<FileChunk> {
    return readChunk(filePath, chunkIndex, options);
  }

  static async readLines(filePath: string, startLine: number, endLine: number): Promise<string[]> {
    return readLines(filePath, startLine, endLine);
  }

  static async navigateToLine(
    filePath: string,
    lineNumber: number,
    contextLines: number = 5
  ): Promise<FileChunk> {
    return navigateToLine(filePath, lineNumber, contextLines);
  }

  static async search(
    filePath: string,
    pattern: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    return search(filePath, pattern, options);
  }

  static async getStructure(filePath: string): Promise<FileStructure> {
    return getStructure(filePath);
  }

  static async getSummary(filePath: string): Promise<FileSummary> {
    return getSummary(filePath);
  }

  static async *streamFile(filePath: string, options: StreamOptions = {}): AsyncGenerator<string> {
    yield* streamFile(filePath, options);
  }
}
