/**
 * Chunked reading, line-range reading, and line navigation
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { FileChunk, ChunkOptions } from '../types.js';
import { verifyFile, getMetadata, getOptimalChunkSize } from './metadata.js';

/**
 * Read specific chunk of file
 */
export async function readChunk(
  filePath: string,
  chunkIndex: number,
  options: ChunkOptions = {}
): Promise<FileChunk> {
  await verifyFile(filePath);

  const metadata = await getMetadata(filePath);
  const linesPerChunk =
    options.linesPerChunk || getOptimalChunkSize(metadata.fileType, metadata.totalLines);
  const overlapLines = options.overlapLines || 10;

  const startLine = Math.max(1, chunkIndex * linesPerChunk - overlapLines + 1);
  const endLine = Math.min(metadata.totalLines, (chunkIndex + 1) * linesPerChunk);

  const lines = await readLines(filePath, startLine, endLine);
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
export async function readLines(
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

    rl.on('line', line => {
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
export async function navigateToLine(
  filePath: string,
  lineNumber: number,
  contextLines: number = 5
): Promise<FileChunk> {
  await verifyFile(filePath);

  const metadata = await getMetadata(filePath);

  if (lineNumber < 1 || lineNumber > metadata.totalLines) {
    throw new Error(`Line number ${lineNumber} out of range (1-${metadata.totalLines})`);
  }

  const startLine = Math.max(1, lineNumber - contextLines);
  const endLine = Math.min(metadata.totalLines, lineNumber + contextLines);

  const lines = await readLines(filePath, startLine, endLine);
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
