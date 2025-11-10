#!/usr/bin/env node

/**
 * Large File MCP Server - Main Entry Point
 */

import { LargeFileMCPServer } from './server.js';

async function main() {
  const server = new LargeFileMCPServer({
    // Configuration can be loaded from environment or config file
    defaultChunkSize: parseInt(process.env.CHUNK_SIZE || '500'),
    defaultOverlap: parseInt(process.env.OVERLAP_LINES || '10'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(10 * 1024 * 1024 * 1024)),
    cache: {
      maxSize: parseInt(process.env.CACHE_SIZE || String(100 * 1024 * 1024)),
      ttl: parseInt(process.env.CACHE_TTL || String(5 * 60 * 1000)),
      enabled: process.env.CACHE_ENABLED !== 'false',
    },
  });

  await server.run();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
