/**
 * Byte-based streaming of large files
 */

import * as fs from 'fs';
import { StreamOptions } from '../types.js';
import { verifyFile } from './metadata.js';

/**
 * Stream file in chunks
 */
export async function* streamFile(
  filePath: string,
  options: StreamOptions = {}
): AsyncGenerator<string> {
  await verifyFile(filePath);

  const chunkSize = options.chunkSize || 64 * 1024; // 64KB default
  const encoding = options.encoding || 'utf-8';

  const stream = fs.createReadStream(filePath, {
    encoding,
    start: options.startOffset,
    end: options.maxBytes ? (options.startOffset || 0) + options.maxBytes : undefined,
    highWaterMark: chunkSize,
  });

  for await (const chunk of stream) {
    yield chunk;
  }
}
