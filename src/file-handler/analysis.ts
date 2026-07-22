/**
 * File structure and content statistics (line stats, char stats, samples)
 */

import * as fs from 'fs';
import * as readline from 'readline';
import { FileStructure, FileSummary, FileType } from '../types.js';
import { verifyFile, getMetadata, getOptimalChunkSize } from './metadata.js';

const SAMPLE_LINES = 10;

/**
 * Get file structure and statistics
 */
export async function getStructure(filePath: string): Promise<FileStructure> {
  await verifyFile(filePath);

  const metadata = await getMetadata(filePath);

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

    rl.on('line', line => {
      lineCount++;

      if (line.trim() === '') emptyLines++;
      maxLineLength = Math.max(maxLineLength, line.length);
      totalLineLength += line.length;

      // Sample start
      if (sampleStart.length < SAMPLE_LINES) {
        sampleStart.push(line);
      }

      // Sample end (keep last N lines)
      endBuffer.push(line);
      if (endBuffer.length > SAMPLE_LINES) {
        endBuffer.shift();
      }
    });

    rl.on('close', () => {
      const recommendedChunkSize = getOptimalChunkSize(metadata.fileType, metadata.totalLines);

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
export async function getSummary(filePath: string): Promise<FileSummary> {
  await verifyFile(filePath);

  const metadata = await getMetadata(filePath);

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

    rl.on('line', line => {
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
          avgLength: metadata.totalLines > 0 ? Math.round(totalLength / metadata.totalLines) : 0,
        },
        charStats: {
          total,
          alphabetic,
          numeric,
          whitespace,
          special,
        },
        wordCount:
          metadata.fileType === FileType.TEXT || metadata.fileType === FileType.MARKDOWN
            ? wordCount
            : undefined,
      });
    });

    rl.on('error', reject);
  });
}
