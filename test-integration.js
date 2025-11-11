#!/usr/bin/env node
/**
 * Integration test using FileHandler static methods directly
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
    console.log('=== Large File MCP Integration Test ===\n');
    console.log(`Test files:`);
    console.log(`  Log file: ${TEST_FILE}`);
    console.log(`  Code file: ${TEST_CODE_FILE}\n`);

    let passCount = 0;
    let failCount = 0;

    // Test 1: Get Metadata
    console.log('TEST 1: Get File Metadata');
    try {
        const metadata = await FileHandler.getMetadata(TEST_FILE);
        console.log(`✅ PASS: Metadata retrieved`);
        console.log(`   Lines: ${metadata.totalLines}`);
        console.log(`   Size: ${metadata.sizeInBytes} bytes`);
        console.log(`   Type: ${metadata.fileType}`);
        console.log(`   Encoding: ${metadata.encoding}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 2: Get Structure
    console.log('TEST 2: Get File Structure');
    try {
        const structure = await FileHandler.getStructure(TEST_CODE_FILE);
        console.log(`✅ PASS: Structure retrieved`);
        console.log(`   Total lines: ${structure.totalLines}`);
        console.log(`   Estimated chunks: ${structure.estimatedChunks}`);
        console.log(`   Optimal chunk size: ${structure.optimalChunkSize}`);
        console.log(`   Preview (first 3 lines):`);
        structure.preview.slice(0, 3).forEach((line, idx) => {
            console.log(`     ${idx + 1}: ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`);
        });
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 3: Read Chunk
    console.log('TEST 3: Read File Chunk');
    try {
        const chunk = await FileHandler.readChunk(TEST_FILE, 0, 10, 0);
        console.log(`✅ PASS: Chunk read successfully`);
        console.log(`   Lines in chunk: ${chunk.lines.length}`);
        console.log(`   Content preview: "${chunk.content.substring(0, 80)}..."`);
        console.log(`   Line range: ${chunk.startLine} to ${chunk.endLine}`);
        console.log(`   Has more chunks: ${chunk.hasMore}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 4: Search in File
    console.log('TEST 4: Search in File');
    try {
        const searchResult = await FileHandler.search(
            TEST_FILE,
            'ERROR',
            {
                caseSensitive: true,
                contextBefore: 1,
                contextAfter: 1,
                maxResults: 10
            }
        );
        console.log(`✅ PASS: Search completed`);
        console.log(`   Total matches: ${searchResult.totalMatches}`);
        console.log(`   Results returned: ${searchResult.matches.length}`);
        if (searchResult.matches.length > 0) {
            const firstMatch = searchResult.matches[0];
            console.log(`   First match at line ${firstMatch.lineNumber}:`);
            console.log(`     "${firstMatch.line.substring(0, 70)}..."`);
        }
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 5: Read Lines Range
    console.log('TEST 5: Read Lines Range');
    try {
        const lines = await FileHandler.readLines(TEST_FILE, 5, 10);
        console.log(`✅ PASS: Lines range read`);
        console.log(`   Lines retrieved: ${lines.length}`);
        console.log(`   Expected: 6 lines (5 to 10 inclusive)`);
        console.log(`   First line: "${lines[0].substring(0, 60)}..."`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 6: Get Summary
    console.log('TEST 6: Get File Summary');
    try {
        const summary = await FileHandler.getSummary(TEST_FILE);
        console.log(`✅ PASS: Summary generated`);
        console.log(`   File type: ${summary.fileType}`);
        console.log(`   Total lines: ${summary.totalLines}`);
        console.log(`   Size: ${summary.sizeInBytes} bytes`);
        console.log(`   Recommended chunk size: ${summary.recommendedChunkSize}`);
        console.log(`   Sample lines: ${summary.sampleLines.length}`);
        passCount++;
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        failCount++;
    }
    console.log();

    // Test 7: Stream File (async generator)
    console.log('TEST 7: Stream File Section');
    try {
        let chunkCount = 0;
        let lineCount = 0;

        for await (const chunk of FileHandler.streamFile(TEST_FILE, { startLine: 0, endLine: 15, chunkSize: 5 })) {
            chunkCount++;
            lineCount += chunk.lines.length;
        }

        console.log(`✅ PASS: File streaming successful`);
        console.log(`   Chunks streamed: ${chunkCount}`);
        console.log(`   Total lines: ${lineCount}`);
        console.log(`   Expected: ~16 lines (0 to 15 inclusive)`);
        passCount++;
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

    if (failCount === 0) {
        console.log('\n🎉 All tests PASSED! Server is functioning correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

    process.exit(failCount > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
});
