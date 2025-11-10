/**
 * Type definitions for Large File MCP Server
 */

export interface FileChunk {
  /** Chunk content */
  content: string;
  /** Starting line number (1-indexed) */
  startLine: number;
  /** Ending line number (1-indexed) */
  endLine: number;
  /** Total lines in file */
  totalLines: number;
  /** Chunk index */
  chunkIndex: number;
  /** Total number of chunks */
  totalChunks: number;
  /** File path */
  filePath: string;
  /** Byte offset start */
  byteOffset: number;
  /** Chunk size in bytes */
  byteSize: number;
}

export interface FileMetadata {
  /** File path */
  path: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Human-readable size */
  sizeFormatted: string;
  /** Total number of lines */
  totalLines: number;
  /** File encoding */
  encoding: string;
  /** Detected file type */
  fileType: FileType;
  /** Creation time */
  createdAt: Date;
  /** Last modified time */
  modifiedAt: Date;
  /** Is text file */
  isText: boolean;
}

export interface FileStructure {
  /** File metadata */
  metadata: FileMetadata;
  /** Line count distribution */
  lineStats: {
    total: number;
    empty: number;
    nonEmpty: number;
    maxLineLength: number;
    avgLineLength: number;
  };
  /** Recommended chunk size for this file */
  recommendedChunkSize: number;
  /** Total chunks with recommended size */
  estimatedChunks: number;
  /** Sample lines from start */
  sampleStart: string[];
  /** Sample lines from end */
  sampleEnd: string[];
}

export interface SearchResult {
  /** Line number (1-indexed) */
  lineNumber: number;
  /** Line content */
  lineContent: string;
  /** Match positions in line */
  matchPositions: Array<{ start: number; end: number }>;
  /** Context lines before */
  contextBefore: string[];
  /** Context lines after */
  contextAfter: string[];
  /** Chunk index containing this result */
  chunkIndex: number;
}

export interface SearchOptions {
  /** Case sensitive search */
  caseSensitive?: boolean;
  /** Regular expression search */
  regex?: boolean;
  /** Maximum results to return */
  maxResults?: number;
  /** Number of context lines before match */
  contextBefore?: number;
  /** Number of context lines after match */
  contextAfter?: number;
  /** Start searching from line */
  startLine?: number;
  /** End searching at line */
  endLine?: number;
}

export interface ChunkOptions {
  /** Chunk size in lines */
  linesPerChunk?: number;
  /** Overlap lines between chunks */
  overlapLines?: number;
  /** Include line numbers in output */
  includeLineNumbers?: boolean;
}

export interface StreamOptions {
  /** Chunk size for streaming */
  chunkSize?: number;
  /** Starting byte offset */
  startOffset?: number;
  /** Maximum bytes to stream */
  maxBytes?: number;
  /** Encoding */
  encoding?: BufferEncoding;
}

export interface FileSummary {
  /** File metadata */
  metadata: FileMetadata;
  /** Line statistics */
  lineStats: {
    total: number;
    empty: number;
    nonEmpty: number;
    maxLength: number;
    avgLength: number;
  };
  /** Character statistics */
  charStats: {
    total: number;
    alphabetic: number;
    numeric: number;
    whitespace: number;
    special: number;
  };
  /** Word count (for text files) */
  wordCount?: number;
  /** Top file patterns (e.g., most common lines) */
  patterns?: Array<{ pattern: string; count: number }>;
}

export enum FileType {
  TEXT = 'text',
  CODE = 'code',
  LOG = 'log',
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  MARKDOWN = 'markdown',
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  size: number;
}

export interface CacheConfig {
  /** Maximum cache size in bytes */
  maxSize: number;
  /** Entry TTL in milliseconds */
  ttl: number;
  /** Enable cache */
  enabled: boolean;
}

export interface ServerConfig {
  /** Default chunk size in lines */
  defaultChunkSize: number;
  /** Default overlap lines */
  defaultOverlap: number;
  /** Maximum file size to process (bytes) */
  maxFileSize: number;
  /** Cache configuration */
  cache: CacheConfig;
  /** Default encoding */
  defaultEncoding: BufferEncoding;
  /** Context lines for search */
  defaultContextLines: number;
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}
