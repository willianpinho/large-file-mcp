/**
 * File type detection, metadata, and existence/readability checks
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { promisify } from 'util';
import { FileMetadata, FileType } from '../types.js';

const stat = promisify(fs.stat);
const access = promisify(fs.access);

/**
 * Detect file type based on extension and content
 */
export function detectFileType(filePath: string): FileType {
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
export function getOptimalChunkSize(fileType: FileType, totalLines: number): number {
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
export async function verifyFile(filePath: string): Promise<void> {
  try {
    await access(filePath, fs.constants.R_OK);
  } catch (_error) {
    throw new Error(`File not accessible: ${filePath}`);
  }

  const stats = await stat(filePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }
}

/**
 * Check if file type is text-based
 */
function isTextFile(fileType: FileType): boolean {
  return fileType !== FileType.BINARY;
}

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
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
export async function countLines(filePath: string): Promise<number> {
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
 * Get file metadata
 */
export async function getMetadata(filePath: string): Promise<FileMetadata> {
  await verifyFile(filePath);

  const stats = await stat(filePath);
  const fileType = detectFileType(filePath);

  return {
    path: filePath,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    totalLines: await countLines(filePath),
    encoding: 'utf-8',
    fileType,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    isText: isTextFile(fileType),
  };
}
