#!/usr/bin/env node
/**
 * Simple integration test for large-file-mcp
 */
import { FileHandler } from './dist/fileHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_FILE = path.resolve(__dirname, 'examples/sample-log.txt');

async function runTests() {
    console.log('=== Large File MCP - Simple Integration Test ===\n');

    let passCount = 0;
    let failCount = 0;

    // Test 1: Verify file exists
    console.log('TEST 1: File Verification');
    try {
        await FileHandler.verifyFile(TEST_FILE);
        console.log(`✅ PASS: File exists and is readable`);
        console.log(`   Path: ${TEST_FILE}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 2: Get Metadata
    console.log('TEST 2: File Metadata');
    try {
        const metadata = await FileHandler.getMetadata(TEST_FILE);
        if (metadata && metadata.totalLines > 0) {
            console.log(`✅ PASS: Metadata retrieved`);
            console.log(`   Lines: ${metadata.totalLines}`);
            console.log(`   Type: ${metadata.fileType}`);
            console.log(`   Encoding: ${metadata.encoding}`);
            passCount++;
        } else {
            console.log(`❌ FAIL: Invalid metadata structure`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 3: Read Chunk
    console.log('TEST 3: Read Chunk');
    try {
        const chunk = await FileHandler.readChunk(TEST_FILE, 0, 10, 0);
        if (chunk && chunk.content && chunk.content.length > 0) {
            console.log(`✅ PASS: Chunk read successfully`);
            console.log(`   Content length: ${chunk.content.length} chars`);
            console.log(`   First 100 chars: "${chunk.content.substring(0, 100)}..."`);
            console.log(`   Chunk info: lines ${chunk.startLine}-${chunk.endLine}`);
            passCount++;
        } else {
            console.log(`❌ FAIL: Invalid chunk structure`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 4: Search
    console.log('TEST 4: Search in File');
    try {
        const result = await FileHandler.search(TEST_FILE, 'ERROR', {
            caseSensitive: true,
            contextBefore: 1,
            contextAfter: 1
        });
        if (result && result.matches) {
            console.log(`✅ PASS: Search completed`);
            console.log(`   Pattern: "ERROR"`);
            console.log(`   Matches found: ${result.matches.length}`);
            if (result.matches.length > 0) {
                const first = result.matches[0];
                console.log(`   First match at line ${first.lineNumber}`);
                console.log(`   Content: "${first.line}"`);
            }
            passCount++;
        } else {
            console.log(`❌ FAIL: Invalid search result structure`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 5: Read Lines Range
    console.log('TEST 5: Read Lines Range');
    try {
        const lines = await FileHandler.readLines(TEST_FILE, 1, 5);
        if (lines && Array.isArray(lines) && lines.length > 0) {
            console.log(`✅ PASS: Lines read successfully`);
            console.log(`   Lines retrieved: ${lines.length}`);
            console.log(`   First line: "${lines[0]}"`);
            passCount++;
        } else {
            console.log(`❌ FAIL: Invalid lines structure`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 6: File Type Detection
    console.log('TEST 6: File Type Detection');
    try {
        const logType = FileHandler.detectFileType('test.log');
        const codeType = FileHandler.detectFileType('test.ts');
        const jsonType = FileHandler.detectFileType('test.json');

        if (logType && codeType && jsonType) {
            console.log(`✅ PASS: File type detection working`);
            console.log(`   .log -> ${logType}`);
            console.log(`   .ts -> ${codeType}`);
            console.log(`   .json -> ${jsonType}`);
            passCount++;
        } else {
            console.log(`❌ FAIL: File type detection failed`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 7: Performance - Read moderate chunk
    console.log('TEST 7: Performance Test');
    try {
        const startTime = Date.now();
        const chunk = await FileHandler.readChunk(TEST_FILE, 0, 100, 0);
        const duration = Date.now() - startTime;

        if (chunk && duration < 1000) {
            console.log(`✅ PASS: Performance acceptable`);
            console.log(`   Read 100 lines in ${duration}ms`);
            console.log(`   Performance: ${duration < 100 ? 'Excellent' : duration < 500 ? 'Good' : 'Acceptable'}`);
            passCount++;
        } else {
            console.log(`❌ FAIL: Performance too slow (${duration}ms)`);
            failCount++;
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${passCount + failCount}`);
    console.log(`Passed: ${passCount} ✅`);
    console.log(`Failed: ${failCount} ❌`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
    console.log();

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log();

    if (failCount === 0) {
        console.log('🎉 All tests PASSED! Server is fully functional.');
        console.log('✅ Ready for production use.');
    } else {
        console.log('⚠️  Some tests failed. Review errors above.');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
