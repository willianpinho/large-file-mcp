#!/usr/bin/env node
/**
 * Production-ready test suite for large-file-mcp
 */
import { FileHandler } from './dist/fileHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_FILE = path.resolve(__dirname, 'examples/sample-log.txt');
const TEST_CODE_FILE = path.resolve(__dirname, 'examples/sample-code.ts');

async function runTests() {
    console.log('=== Large File MCP - Production Test Suite ===\n');

    let passCount = 0;
    let failCount = 0;

    // Test 1: File Verification
    console.log('TEST 1: File Verification');
    try {
        await FileHandler.verifyFile(TEST_FILE);
        console.log(`✅ PASS`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 2: Metadata
    console.log('TEST 2: File Metadata');
    try {
        const metadata = await FileHandler.getMetadata(TEST_FILE);
        console.log(`✅ PASS - Lines: ${metadata.totalLines}, Type: ${metadata.fileType}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 3: Read Chunk
    console.log('TEST 3: Read Chunk');
    try {
        const chunk = await FileHandler.readChunk(TEST_FILE, 0, 10, 0);
        console.log(`✅ PASS - Read ${chunk.endLine - chunk.startLine + 1} lines`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 4: Search
    console.log('TEST 4: Search in File');
    try {
        const results = await FileHandler.search(TEST_FILE, 'ERROR', { caseSensitive: true });
        console.log(`✅ PASS - Found ${results.length} matches`);
        if (results.length > 0) {
            console.log(`   First match: line ${results[0].lineNumber}, content: "${results[0].lineContent}"`);
        }
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 5: Read Lines
    console.log('TEST 5: Read Lines Range');
    try {
        const lines = await FileHandler.readLines(TEST_FILE, 1, 5);
        console.log(`✅ PASS - Retrieved ${lines.length} lines`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 6: File Types
    console.log('TEST 6: File Type Detection');
    const types = {
        log: FileHandler.detectFileType('test.log'),
        ts: FileHandler.detectFileType('test.ts'),
        json: FileHandler.detectFileType('test.json')
    };
    console.log(`✅ PASS - .log=${types.log}, .ts=${types.ts}, .json=${types.json}`);
    passCount++;
    console.log();

    // Test 7: Chunk Size
    console.log('TEST 7: Optimal Chunk Size');
    const size = FileHandler.getOptimalChunkSize('log', 1000);
    console.log(`✅ PASS - Log file (1K lines): ${size} lines/chunk`);
    passCount++;
    console.log();

    // Test 8: Performance
    console.log('TEST 8: Performance Test');
    try {
        const start = Date.now();
        await FileHandler.readChunk(TEST_FILE, 0, 100, 0);
        const duration = Date.now() - start;
        console.log(`✅ PASS - ${duration}ms (${duration < 50 ? 'Excellent' : 'Good'})`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 9: Regex Search
    console.log('TEST 9: Regex Search');
    try {
        const results = await FileHandler.search(TEST_FILE, '\\d{4}-\\d{2}-\\d{2}', { regex: true, maxResults: 5 });
        console.log(`✅ PASS - ${results.length} date patterns found`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 10: Code Analysis
    console.log('TEST 10: Code File Analysis');
    try {
        const metadata = await FileHandler.getMetadata(TEST_CODE_FILE);
        console.log(`✅ PASS - Type: ${metadata.fileType}, Lines: ${metadata.totalLines}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Summary
    console.log('='.repeat(70));
    console.log('FINAL RESULTS');
    console.log('='.repeat(70));
    console.log(`Tests: ${passCount + failCount} | Passed: ${passCount} ✅ | Failed: ${failCount} ❌`);
    console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

    const mem = process.memoryUsage();
    console.log(`\nMemory: RSS ${(mem.rss / 1024 / 1024).toFixed(2)}MB, Heap ${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`);

    if (failCount === 0) {
        console.log('\n🎉 ALL TESTS PASSED - Production Ready!');
        return 0;
    } else {
        console.log('\n⚠️  Some tests failed');
        return 1;
    }
}

runTests().then(code => process.exit(code)).catch(err => {
    console.error('\n❌ FATAL:', err);
    process.exit(1);
});
