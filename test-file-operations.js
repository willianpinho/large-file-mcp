#!/usr/bin/env node
/**
 * Test script to verify file operations work correctly
 */
import { FileHandler } from './dist/fileHandler.js';
import { CacheManager } from './dist/cacheManager.js';
import fs from 'fs';
import path from 'path';

const TEST_FILE = './examples/sample-log.txt';
const TEST_CODE_FILE = './examples/sample-code.ts';

async function runTests() {
    console.log('=== File Operations Test Suite ===\n');

    const cache = new CacheManager({
        maxSize: 100 * 1024 * 1024,
        ttl: 5 * 60 * 1000,
        enabled: true,
    });

    const handler = new FileHandler(
        500,  // defaultChunkSize
        10,   // defaultOverlap
        10 * 1024 * 1024 * 1024,  // maxFileSize
        cache
    );

    let passCount = 0;
    let failCount = 0;

    // Test 1: Read File Chunk
    console.log('TEST 1: Read File Chunk');
    try {
        const result = await handler.readFileChunk(
            path.resolve(TEST_FILE),
            1,
            10
        );

        if (result.content && result.lines && result.totalLines) {
            console.log(`✅ PASS: Read ${result.lines.length} lines from chunk 1`);
            console.log(`   Total lines in file: ${result.totalLines}`);
            console.log(`   Chunk info: ${result.chunkInfo}`);
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid response structure');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 2: Get File Structure
    console.log('TEST 2: Get File Structure');
    try {
        const structure = await handler.getFileStructure(path.resolve(TEST_CODE_FILE));

        if (structure.totalLines && structure.encoding) {
            console.log(`✅ PASS: File structure retrieved`);
            console.log(`   Total lines: ${structure.totalLines}`);
            console.log(`   Encoding: ${structure.encoding}`);
            console.log(`   Size: ${structure.sizeInBytes} bytes`);
            console.log(`   Estimated chunks: ${structure.estimatedChunks}`);
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid structure response');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 3: Search in File
    console.log('TEST 3: Search in File');
    try {
        const searchResults = await handler.searchInFile(
            path.resolve(TEST_FILE),
            'ERROR',
            { caseSensitive: true }
        );

        if (searchResults.matches && Array.isArray(searchResults.matches)) {
            console.log(`✅ PASS: Search completed`);
            console.log(`   Matches found: ${searchResults.totalMatches}`);
            console.log(`   Lines with matches: ${searchResults.matches.length}`);
            if (searchResults.matches.length > 0) {
                console.log(`   First match: Line ${searchResults.matches[0].lineNumber}`);
            }
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid search response');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 4: Get File Stats
    console.log('TEST 4: Get File Stats');
    try {
        const stats = await handler.getFileStats(path.resolve(TEST_FILE));

        if (stats.exists && stats.size !== undefined) {
            console.log(`✅ PASS: File stats retrieved`);
            console.log(`   Size: ${stats.size} bytes`);
            console.log(`   Type: ${stats.type}`);
            console.log(`   Readable: ${stats.permissions.readable}`);
            console.log(`   Last modified: ${new Date(stats.modified).toLocaleString()}`);
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid stats response');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 5: List Chunks
    console.log('TEST 5: List Chunks');
    try {
        const chunks = await handler.listChunks(
            path.resolve(TEST_FILE),
            100  // chunkSize
        );

        if (chunks.chunks && Array.isArray(chunks.chunks)) {
            console.log(`✅ PASS: Chunk list generated`);
            console.log(`   Total chunks: ${chunks.totalChunks}`);
            console.log(`   Chunk size: ${chunks.chunkSize} lines`);
            console.log(`   First chunk: lines ${chunks.chunks[0].startLine}-${chunks.chunks[0].endLine}`);
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid chunks response');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 6: Stream File Section
    console.log('TEST 6: Stream File Section');
    try {
        const section = await handler.streamFileSection(
            path.resolve(TEST_FILE),
            5,
            15
        );

        if (section.content && section.lines) {
            console.log(`✅ PASS: File section streamed`);
            console.log(`   Lines retrieved: ${section.lines.length}`);
            console.log(`   Expected range: 5-15 (${15 - 5 + 1} lines)`);
            console.log(`   Section info: ${section.sectionInfo}`);
            passCount++;
        } else {
            console.log('❌ FAIL: Invalid section response');
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Summary
    console.log('='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`Passed: ${passCount} ✅`);
    console.log(`Failed: ${failCount} ❌`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    console.log();

    // Cache stats
    const cacheStats = cache.getStats();
    console.log('Cache Statistics:');
    console.log(`  Entries: ${cacheStats.entries}`);
    console.log(`  Size: ${(cacheStats.size / 1024).toFixed(2)} KB`);
    console.log(`  Hit rate: ${cacheStats.hitRate.toFixed(2)}%`);
    console.log(`  Hits: ${cacheStats.hits}, Misses: ${cacheStats.misses}`);

    process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
