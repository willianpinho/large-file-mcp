# Log Analysis Examples

Real-world examples of analyzing large log files efficiently.

## Overview

Log files can grow to gigabytes in production environments. This guide demonstrates practical patterns for analyzing logs using Large File MCP Server without memory issues.

## Basic Log Analysis

### Find All Errors

Search for errors with surrounding context:

```typescript
const errors = await search_in_large_file({
  filePath: "/var/log/app.log",
  pattern: "ERROR|FATAL",
  regex: true,
  contextBefore: 3,
  contextAfter: 3,
  maxResults: 50
});

console.log(`Found ${errors.totalMatches} errors`);
errors.matches.forEach(match => {
  console.log(`Line ${match.lineNumber}: ${match.line}`);
  console.log("Context before:", match.contextBefore);
  console.log("Context after:", match.contextAfter);
  console.log("---");
});
```

### Analyze Error Frequency

Count errors by time period:

```typescript
const stream = stream_large_file({
  filePath: "/var/log/app.log",
  chunkSize: 1000
});

const errorsByHour = new Map<string, number>();

for await (const chunk of stream) {
  for (const line of chunk.lines) {
    if (line.includes("ERROR")) {
      // Extract timestamp: "2024-01-10 15:23:45"
      const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}):/);
      if (timeMatch) {
        const hour = timeMatch[1];
        errorsByHour.set(hour, (errorsByHour.get(hour) || 0) + 1);
      }
    }
  }
}

// Display results
console.log("Errors by hour:");
Array.from(errorsByHour.entries())
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([hour, count]) => {
    console.log(`${hour}:00 - ${count} errors`);
  });
```

## Advanced Patterns

### Database Error Investigation

Find database connection issues with full context:

```typescript
async function investigateDatabaseErrors(logFile: string) {
  // Step 1: Find database errors
  const errors = await search_in_large_file({
    filePath: logFile,
    pattern: "(ERROR|FATAL).*database.*(timeout|connection|deadlock)",
    regex: true,
    contextBefore: 5,
    contextAfter: 5,
    maxResults: 20
  });

  console.log(`Found ${errors.totalMatches} database errors\n`);

  // Step 2: Analyze each error
  for (const error of errors.matches) {
    console.log(`=== Error at line ${error.lineNumber} ===`);
    console.log("Error:", error.line);

    // Check context for related information
    const hasRetry = error.contextAfter.some(line =>
      line.includes("retry")
    );
    const hasRecovery = error.contextAfter.some(line =>
      line.includes("recovered") || line.includes("success")
    );

    if (hasRetry) {
      console.log("✓ Retry attempted");
    }
    if (hasRecovery) {
      console.log("✓ Successfully recovered");
    } else {
      console.log("⚠ No recovery detected");
    }

    console.log("\nFull context:");
    console.log(error.contextBefore.join("\n"));
    console.log(">>> " + error.line);
    console.log(error.contextAfter.join("\n"));
    console.log("\n");
  }
}

await investigateDatabaseErrors("/var/log/app.log");
```

### Performance Analysis

Identify slow queries and operations:

```typescript
async function analyzePerformance(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 500
  });

  const slowOperations: Array<{
    operation: string;
    duration: number;
    lineNumber: number;
  }> = [];

  let currentLine = 0;

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      currentLine++;

      // Extract duration: "Query took 1234ms"
      const durationMatch = line.match(/took\s+(\d+)ms/);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1]);

        // Flag operations > 1 second
        if (duration > 1000) {
          // Extract operation name
          const opMatch = line.match(/(\w+)\s+took/);
          const operation = opMatch ? opMatch[1] : "unknown";

          slowOperations.push({
            operation,
            duration,
            lineNumber: currentLine
          });
        }
      }
    }
  }

  // Sort by duration (slowest first)
  slowOperations.sort((a, b) => b.duration - a.duration);

  console.log("Top 10 slowest operations:");
  slowOperations.slice(0, 10).forEach(op => {
    console.log(
      `${op.operation}: ${op.duration}ms (line ${op.lineNumber})`
    );
  });

  // Statistics
  const avgDuration =
    slowOperations.reduce((sum, op) => sum + op.duration, 0) /
    slowOperations.length;

  console.log(`\nTotal slow operations: ${slowOperations.length}`);
  console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
}

await analyzePerformance("/var/log/app.log");
```

### Security Audit

Find failed login attempts and suspicious activity:

```typescript
async function securityAudit(authLog: string) {
  console.log("=== Security Audit ===\n");

  // 1. Failed login attempts
  const failedLogins = await search_in_large_file({
    filePath: authLog,
    pattern: "Failed password.*from\\s+(\\d{1,3}\\.){3}\\d{1,3}",
    regex: true,
    contextAfter: 2,
    maxResults: 100
  });

  console.log(`Failed login attempts: ${failedLogins.totalMatches}`);

  // Count by IP
  const ipCounts = new Map<string, number>();
  failedLogins.matches.forEach(match => {
    const ipMatch = match.line.match(/(\d{1,3}\.){3}\d{1,3}/);
    if (ipMatch) {
      const ip = ipMatch[0];
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    }
  });

  // Show top offenders
  console.log("\nTop 5 IPs with failed attempts:");
  Array.from(ipCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([ip, count]) => {
      console.log(`${ip}: ${count} attempts`);
      if (count > 10) {
        console.log(`  ⚠ ALERT: Potential brute force attack`);
      }
    });

  // 2. Privilege escalation attempts
  const sudoAttempts = await search_in_large_file({
    filePath: authLog,
    pattern: "sudo.*COMMAND",
    regex: true,
    contextBefore: 1,
    maxResults: 50
  });

  console.log(`\nSudo commands executed: ${sudoAttempts.totalMatches}`);

  // 3. Root logins
  const rootLogins = await search_in_large_file({
    filePath: authLog,
    pattern: "session opened for user root",
    regex: false,
    contextBefore: 2,
    maxResults: 20
  });

  console.log(`Root login sessions: ${rootLogins.totalMatches}`);
  if (rootLogins.totalMatches > 0) {
    console.log("⚠ WARNING: Direct root logins detected");
  }
}

await securityAudit("/var/log/auth.log");
```

## Real-Time Monitoring

### Tail Log File

Monitor log file for new entries:

```typescript
async function tailLog(logFile: string, pattern?: string) {
  // Get current file structure
  let structure = await get_file_structure({
    filePath: logFile
  });

  let lastLine = structure.totalLines;

  console.log(`Monitoring ${logFile} from line ${lastLine}...`);
  console.log("Press Ctrl+C to stop\n");

  // Poll for new lines
  while (true) {
    await sleep(1000); // Check every second

    const newStructure = await get_file_structure({
      filePath: logFile
    });

    if (newStructure.totalLines > lastLine) {
      // Read new lines
      const chunk = await read_large_file_chunk({
        filePath: logFile,
        chunkIndex: Math.floor(lastLine / newStructure.chunkSize)
      });

      // Extract only new lines
      const newLines = chunk.content
        .split("\n")
        .slice(lastLine % newStructure.chunkSize);

      // Filter by pattern if provided
      const filtered = pattern
        ? newLines.filter(line => line.includes(pattern))
        : newLines;

      filtered.forEach(line => {
        console.log(line);
      });

      lastLine = newStructure.totalLines;
    }
  }
}

// Monitor for errors
await tailLog("/var/log/app.log", "ERROR");
```

### Real-Time Alerts

Send alerts for critical errors:

```typescript
async function monitorWithAlerts(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 10
  });

  const criticalPatterns = [
    /FATAL/,
    /OutOfMemory/,
    /StackOverflow/,
    /database.*connection.*failed/i,
    /disk.*full/i
  ];

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      for (const pattern of criticalPatterns) {
        if (pattern.test(line)) {
          console.error("🚨 CRITICAL ALERT:", line);

          // Send notification
          await sendAlert({
            severity: "critical",
            message: line,
            timestamp: new Date()
          });

          // Get more context
          const context = await navigate_to_line({
            filePath: logFile,
            lineNumber: chunk.startLine + chunk.lines.indexOf(line),
            contextLines: 10
          });

          console.log("Context:", context);
        }
      }
    }

    // Brief pause to avoid overwhelming
    await sleep(100);
  }
}
```

## Statistical Analysis

### Log Volume Analysis

Analyze log volume over time:

```typescript
async function analyzeLogVolume(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 5000
  });

  const volumeByHour = new Map<string, number>();
  const levelCounts = {
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0
  };

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      // Extract timestamp hour
      const timeMatch = line.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}):/);
      if (timeMatch) {
        const hour = timeMatch[1];
        volumeByHour.set(hour, (volumeByHour.get(hour) || 0) + 1);
      }

      // Count by level
      for (const level of Object.keys(levelCounts)) {
        if (line.includes(level)) {
          levelCounts[level]++;
          break;
        }
      }
    }
  }

  // Display results
  console.log("=== Log Volume Analysis ===\n");

  console.log("Volume by hour:");
  Array.from(volumeByHour.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([hour, count]) => {
      const bar = "█".repeat(Math.ceil(count / 100));
      console.log(`${hour}:00 | ${bar} ${count}`);
    });

  console.log("\nLog levels:");
  Object.entries(levelCounts).forEach(([level, count]) => {
    const total = Object.values(levelCounts).reduce((a, b) => a + b, 0);
    const percent = ((count / total) * 100).toFixed(1);
    console.log(`${level}: ${count} (${percent}%)`);
  });

  // Find peak hour
  const peakHour = Array.from(volumeByHour.entries()).reduce((max, entry) =>
    entry[1] > max[1] ? entry : max
  );

  console.log(`\nPeak activity: ${peakHour[0]}:00 (${peakHour[1]} logs)`);
}

await analyzeLogVolume("/var/log/app.log");
```

### Response Time Analysis

Analyze API response times:

```typescript
async function analyzeResponseTimes(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 1000
  });

  const responseTimes: number[] = [];
  const endpointTimes = new Map<string, number[]>();

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      // Extract: "GET /api/users took 123ms"
      const match = line.match(/(GET|POST|PUT|DELETE)\s+(\/\S+).*?(\d+)ms/);
      if (match) {
        const [, method, endpoint, ms] = match;
        const time = parseInt(ms);

        responseTimes.push(time);

        const key = `${method} ${endpoint}`;
        if (!endpointTimes.has(key)) {
          endpointTimes.set(key, []);
        }
        endpointTimes.get(key)!.push(time);
      }
    }
  }

  // Calculate percentiles
  const sorted = responseTimes.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  console.log("=== Response Time Analysis ===\n");
  console.log(`Total requests: ${responseTimes.length}`);
  console.log(`Average: ${avg.toFixed(0)}ms`);
  console.log(`P50: ${p50}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`P99: ${p99}ms`);

  // Slowest endpoints
  console.log("\nSlowest endpoints (P95):");
  Array.from(endpointTimes.entries())
    .map(([endpoint, times]) => {
      const sorted = times.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      return { endpoint, p95, count: times.length };
    })
    .sort((a, b) => b.p95 - a.p95)
    .slice(0, 10)
    .forEach(({ endpoint, p95, count }) => {
      console.log(`${endpoint}: ${p95}ms (${count} requests)`);
    });
}

await analyzeResponseTimes("/var/log/access.log");
```

## Best Practices

### 1. Use Streaming for Large Files

For files > 100MB, always use streaming:

```typescript
// Good: Streaming approach
async function processLargeLog(logFile: string) {
  const stream = stream_large_file({
    filePath: logFile,
    chunkSize: 1000
  });

  for await (const chunk of stream) {
    await processChunk(chunk.lines);
  }
}

// Bad: Loading entire file
async function processLargeLogBad(logFile: string) {
  const allLines = await readFileSync(logFile, "utf-8").split("\n");
  // OutOfMemoryError for large files!
}
```

### 2. Limit Search Results

Use `maxResults` to prevent scanning entire file:

```typescript
// Good: Limited search
const errors = await search_in_large_file({
  filePath: logFile,
  pattern: "ERROR",
  maxResults: 100
});

// Bad: Unlimited search (slow for large files)
const allErrors = await search_in_large_file({
  filePath: logFile,
  pattern: "ERROR"
  // Will scan entire file
});
```

### 3. Cache File Structure

File metadata rarely changes:

```typescript
// Cache file structure
let cachedStructure = null;

async function getStructure(logFile: string) {
  if (!cachedStructure) {
    cachedStructure = await get_file_structure({
      filePath: logFile
    });
  }
  return cachedStructure;
}
```

### 4. Use Appropriate Context

Balance detail vs. performance:

```typescript
// Quick scan: minimal context
const quickScan = await search_in_large_file({
  filePath: logFile,
  pattern: "ERROR",
  contextBefore: 1,
  contextAfter: 1
});

// Deep investigation: more context
const deepDive = await search_in_large_file({
  filePath: logFile,
  pattern: "ERROR",
  contextBefore: 10,
  contextAfter: 10,
  maxResults: 5
});
```

## See Also

- [API Reference](/api/reference) - All available tools
- [search_in_large_file](/api/search) - Search documentation
- [stream_large_file](/api/stream) - Streaming documentation
- [Code Navigation](/examples/code-navigation) - Code analysis examples
- [Performance Guide](/guide/performance) - Optimization tips
