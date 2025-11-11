# stream_large_file

Stream large files progressively without loading into memory.

## Overview

The `stream_large_file` tool provides an async generator interface for processing large files line-by-line or chunk-by-chunk without memory overhead. This is ideal for real-time processing, pipelines, and handling files that exceed available memory.

## Usage

```json
{
  "tool": "stream_large_file",
  "arguments": {
    "filePath": "/var/log/massive.log",
    "chunkSize": 100
  }
}
```

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `filePath` | string | Yes | - | Absolute or relative path to the file |
| `chunkSize` | number | No | 100 | Number of lines per yielded chunk |
| `startLine` | number | No | 1 | Line number to start streaming from |
| `endLine` | number | No | EOF | Line number to stop streaming at |

## Response Format

The tool returns an async generator that yields chunks:

```typescript
AsyncGenerator<{
  lines: string[];        // Array of lines in chunk
  chunkIndex: number;     // Current chunk number (0-based)
  startLine: number;      // First line number in chunk
  endLine: number;        // Last line number in chunk
  hasMore: boolean;       // Whether more chunks exist
}>
```

## Examples

### Basic Streaming

Stream entire file in chunks of 100 lines:

```typescript
const stream = stream_large_file({
  filePath: "/var/log/app.log",
  chunkSize: 100
});

for await (const chunk of stream) {
  console.log(`Processing lines ${chunk.startLine}-${chunk.endLine}`);
  processLines(chunk.lines);
}
```

### Custom Chunk Size

Stream with larger chunks for better throughput:

```typescript
const stream = stream_large_file({
  filePath: "/data/large.csv",
  chunkSize: 1000
});

for await (const chunk of stream) {
  await processCsvChunk(chunk.lines);
}
```

### Partial Streaming

Stream specific line range:

```typescript
const stream = stream_large_file({
  filePath: "/var/log/system.log",
  startLine: 10000,
  endLine: 20000,
  chunkSize: 500
});

for await (const chunk of stream) {
  console.log(`Chunk ${chunk.chunkIndex}: ${chunk.lines.length} lines`);
}
```

### Progress Tracking

Monitor streaming progress:

```typescript
const stream = stream_large_file({
  filePath: "/data/huge.log",
  chunkSize: 100
});

let processedLines = 0;
for await (const chunk of stream) {
  processedLines += chunk.lines.length;
  const progress = (processedLines / totalLines) * 100;
  console.log(`Progress: ${progress.toFixed(2)}%`);
  await processChunk(chunk.lines);
}
```

## Common Use Cases

### 1. Log Processing Pipeline

Process logs in real-time:

```typescript
async function processLogStream(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 500
  });

  const errors: string[] = [];

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      if (line.includes("ERROR")) {
        errors.push(line);
      }
    }
  }

  return errors;
}
```

### 2. Data Transformation

Transform CSV data row-by-row:

```typescript
async function transformCsv(inputFile: string, outputFile: string) {
  const stream = stream_large_file({
    filePath: inputFile,
    chunkSize: 1000
  });

  const writer = fs.createWriteStream(outputFile);

  for await (const chunk of stream) {
    const transformed = chunk.lines
      .map(line => transformRow(line))
      .join("\n");

    writer.write(transformed + "\n");
  }

  writer.end();
}
```

### 3. Statistical Analysis

Calculate statistics without loading full file:

```typescript
async function calculateStats(dataFile: string) {
  const stream = stream_large_file({
    filePath: dataFile,
    chunkSize: 1000
  });

  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      const value = parseFloat(line);
      sum += value;
      count++;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return {
    average: sum / count,
    min,
    max,
    count
  };
}
```

### 4. Search and Extract

Find and extract matching lines:

```typescript
async function extractMatches(logFile: string, pattern: RegExp) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 500
  });

  const matches: Array<{ lineNumber: number; content: string }> = [];

  for await (const chunk of stream) {
    chunk.lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push({
          lineNumber: chunk.startLine + index,
          content: line
        });
      }
    });
  }

  return matches;
}
```

### 5. Real-time Monitoring

Monitor log file as it grows:

```typescript
async function monitorLog(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 10
  });

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      if (line.includes("ERROR") || line.includes("FATAL")) {
        console.error("🚨 Alert:", line);
        sendAlert(line);
      }
    }

    // Brief pause before next chunk
    await sleep(100);
  }
}
```

## Performance

| File Size | Chunk Size | Memory Usage | Throughput | Notes |
|-----------|-----------|--------------|------------|-------|
| < 10MB | 100 | < 1MB | 10K lines/s | Fast |
| 10-100MB | 500 | < 5MB | 50K lines/s | Optimal |
| 100MB-1GB | 1000 | < 10MB | 100K lines/s | High throughput |
| > 1GB | 5000 | < 50MB | 200K lines/s | Maximum efficiency |

### Memory Characteristics

- **Constant Memory**: O(chunkSize) - independent of file size
- **No Full Load**: Never loads entire file into memory
- **Streaming**: True line-by-line streaming
- **Backpressure**: Automatic backpressure handling

## Best Practices

### 1. Choose Optimal Chunk Size

Balance memory and throughput:

```typescript
// Small files or real-time: small chunks
const realtimeStream = stream_large_file({
  filePath: "current.log",
  chunkSize: 10  // Low latency
});

// Large files: larger chunks
const batchStream = stream_large_file({
  filePath: "archive.log",
  chunkSize: 5000  // High throughput
});
```

### 2. Handle Errors Gracefully

```typescript
async function safeStream(filePath: string) {
  try {
    const stream = stream_large_file({ filePath, chunkSize: 100 });

    for await (const chunk of stream) {
      try {
        await processChunk(chunk);
      } catch (error) {
        console.error(`Error in chunk ${chunk.chunkIndex}:`, error);
        // Continue processing other chunks
      }
    }
  } catch (error) {
    console.error("Stream error:", error);
  }
}
```

### 3. Implement Backpressure

Control processing rate:

```typescript
async function streamWithBackpressure(filePath: string) {
  const stream = stream_large_file({ filePath, chunkSize: 100 });
  const maxConcurrent = 5;
  const queue: Promise<void>[] = [];

  for await (const chunk of stream) {
    const task = processChunk(chunk);
    queue.push(task);

    // Wait if queue is full
    if (queue.length >= maxConcurrent) {
      await Promise.race(queue);
      queue.splice(queue.findIndex(p => p === task), 1);
    }
  }

  // Wait for remaining tasks
  await Promise.all(queue);
}
```

### 4. Progress Reporting

Show user-friendly progress:

```typescript
async function streamWithProgress(filePath: string) {
  // Get total lines first
  const structure = await get_file_structure({ filePath });
  const totalLines = structure.totalLines;

  const stream = stream_large_file({ filePath, chunkSize: 1000 });
  let processedLines = 0;

  for await (const chunk of stream) {
    processedLines += chunk.lines.length;
    const percent = ((processedLines / totalLines) * 100).toFixed(1);
    console.log(`Progress: ${percent}% (${processedLines}/${totalLines})`);

    await processChunk(chunk);
  }
}
```

### 5. Parallel Processing

Process chunks in parallel:

```typescript
async function parallelStream(filePath: string) {
  const stream = stream_large_file({ filePath, chunkSize: 100 });
  const workers = 4;
  const chunks: any[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);

    // Process in batches
    if (chunks.length >= workers) {
      await Promise.all(chunks.map(c => processChunk(c)));
      chunks.length = 0;
    }
  }

  // Process remaining
  if (chunks.length > 0) {
    await Promise.all(chunks.map(c => processChunk(c)));
  }
}
```

## Error Handling

### File Not Found

```typescript
try {
  const stream = stream_large_file({ filePath: "missing.log" });
  for await (const chunk of stream) {
    // ...
  }
} catch (error) {
  console.error("File not found:", error);
}
```

### Permission Denied

```typescript
try {
  const stream = stream_large_file({ filePath: "/root/protected.log" });
  for await (const chunk of stream) {
    // ...
  }
} catch (error) {
  console.error("Permission denied:", error);
}
```

### Invalid Range

```typescript
const stream = stream_large_file({
  filePath: "file.log",
  startLine: 10000,
  endLine: 5000  // Error: endLine < startLine
});
```

## Comparison with Other Methods

| Method | Memory | Speed | Use Case |
|--------|--------|-------|----------|
| `stream_large_file` | O(chunkSize) | Fast | Real-time, large files |
| `read_large_file_chunk` | O(chunkSize) | Faster | Random access |
| `fs.readFileSync` | O(fileSize) | Fastest | Small files only |
| `readline` | O(1) | Slow | Line-by-line |

## Advanced Patterns

### 1. Transform Stream

```typescript
async function* transformStream(filePath: string, transformer: (line: string) => string) {
  const stream = stream_large_file({ filePath, chunkSize: 100 });

  for await (const chunk of stream) {
    const transformed = chunk.lines.map(transformer);
    yield {
      ...chunk,
      lines: transformed
    };
  }
}

// Usage
const transformed = transformStream("/data/input.csv", line =>
  line.toUpperCase()
);

for await (const chunk of transformed) {
  console.log(chunk.lines);
}
```

### 2. Filter Stream

```typescript
async function* filterStream(filePath: string, predicate: (line: string) => boolean) {
  const stream = stream_large_file({ filePath, chunkSize: 100 });

  for await (const chunk of stream) {
    const filtered = chunk.lines.filter(predicate);
    if (filtered.length > 0) {
      yield {
        ...chunk,
        lines: filtered
      };
    }
  }
}

// Usage
const errors = filterStream("/var/log/app.log", line =>
  line.includes("ERROR")
);

for await (const chunk of errors) {
  console.log("Error chunk:", chunk.lines);
}
```

### 3. Reduce Stream

```typescript
async function reduceStream<T>(
  filePath: string,
  reducer: (acc: T, line: string) => T,
  initialValue: T
): Promise<T> {
  const stream = stream_large_file({ filePath, chunkSize: 1000 });
  let accumulator = initialValue;

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      accumulator = reducer(accumulator, line);
    }
  }

  return accumulator;
}

// Usage: Count lines with "ERROR"
const errorCount = await reduceStream(
  "/var/log/app.log",
  (count, line) => count + (line.includes("ERROR") ? 1 : 0),
  0
);
```

## See Also

- [Tools Overview](/api/reference) - All available tools
- [read_large_file_chunk](/api/read-chunk) - Chunk-based reading
- [search_in_large_file](/api/search) - Search functionality
- [Performance Guide](/guide/performance) - Optimization tips
- [Best Practices](/guide/best-practices) - Usage recommendations
- [CSV Processing Example](/examples/csv-processing) - Real-world streaming
