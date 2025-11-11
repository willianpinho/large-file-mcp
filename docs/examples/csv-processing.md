# CSV Processing Examples

Efficient processing of large CSV files with Large File MCP Server.

## Overview

CSV files can grow to millions of rows in data processing pipelines. This guide demonstrates memory-efficient patterns for CSV analysis, validation, and transformation.

## Basic CSV Operations

### Read CSV with Headers

Parse CSV with automatic header detection:

```typescript
async function readCsvWithHeaders(csvFile: string) {
  // Read first chunk to get headers
  const firstChunk = await read_large_file_chunk({
    filePath: csvFile,
    chunkIndex: 0
  });

  const lines = firstChunk.content.split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  console.log("CSV Headers:", headers);
  console.log("Total rows:", firstChunk.totalLines - 1); // Exclude header

  // Read first few data rows
  const dataRows = lines.slice(1, 6);
  console.log("\nFirst 5 rows:");
  dataRows.forEach((row, idx) => {
    const values = row.split(",");
    console.log(`Row ${idx + 1}:`);
    headers.forEach((header, i) => {
      console.log(`  ${header}: ${values[i]}`);
    });
    console.log();
  });
}

await readCsvWithHeaders("/data/sales.csv");
```

### Stream CSV Processing

Process large CSV files row-by-row:

```typescript
async function processCsv(csvFile: string) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  let totalRows = 0;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    // Extract headers from first chunk
    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      lines.shift(); // Remove header row
      isFirstChunk = false;
    }

    // Process data rows
    for (const line of lines) {
      const values = line.split(",");
      const row = Object.fromEntries(
        headers.map((header, i) => [header, values[i]])
      );

      await processRow(row);
      totalRows++;
    }

    console.log(`Processed ${totalRows} rows...`);
  }

  console.log(`\nComplete! Total rows: ${totalRows}`);
}

async function processRow(row: Record<string, string>) {
  // Your processing logic here
  // e.g., validation, transformation, database insert
}

await processCsv("/data/transactions.csv");
```

## Data Validation

### Validate CSV Structure

Check for structural issues:

```typescript
async function validateCsvStructure(csvFile: string) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  let errors: Array<{ row: number; issue: string }> = [];
  let currentRow = 0;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",");
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      currentRow++;
      const values = line.split(",");

      // Check column count
      if (values.length !== headers.length) {
        errors.push({
          row: currentRow,
          issue: `Column count mismatch: expected ${headers.length}, got ${values.length}`
        });
      }

      // Check for empty values
      values.forEach((value, idx) => {
        if (!value.trim()) {
          errors.push({
            row: currentRow,
            issue: `Empty value in column "${headers[idx]}"`
          });
        }
      });

      // Limit error collection
      if (errors.length >= 100) break;
    }

    if (errors.length >= 100) break;
  }

  // Report results
  if (errors.length === 0) {
    console.log("✓ CSV structure is valid");
  } else {
    console.log(`✗ Found ${errors.length} issues:\n`);
    errors.slice(0, 20).forEach(error => {
      console.log(`Row ${error.row}: ${error.issue}`);
    });

    if (errors.length > 20) {
      console.log(`\n... and ${errors.length - 20} more issues`);
    }
  }
}

await validateCsvStructure("/data/import.csv");
```

### Data Type Validation

Validate data types in columns:

```typescript
interface ColumnSchema {
  name: string;
  type: "string" | "number" | "date" | "email";
  required?: boolean;
}

async function validateDataTypes(
  csvFile: string,
  schema: ColumnSchema[]
) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  let errors: string[] = [];
  let currentRow = 0;

  const validators = {
    number: (val: string) => !isNaN(parseFloat(val)),
    date: (val: string) => !isNaN(Date.parse(val)),
    email: (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    string: () => true
  };

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      currentRow++;
      const values = line.split(",");

      schema.forEach((column, idx) => {
        const value = values[idx]?.trim();

        // Check required
        if (column.required && !value) {
          errors.push(
            `Row ${currentRow}: Missing required value in "${column.name}"`
          );
          return;
        }

        // Check type
        if (value && !validators[column.type](value)) {
          errors.push(
            `Row ${currentRow}: Invalid ${column.type} in "${column.name}": "${value}"`
          );
        }
      });

      if (errors.length >= 100) break;
    }

    if (errors.length >= 100) break;
  }

  // Report
  if (errors.length === 0) {
    console.log("✓ All data types are valid");
  } else {
    console.log(`✗ Found ${errors.length} validation errors:\n`);
    errors.slice(0, 20).forEach(error => console.log(error));

    if (errors.length > 20) {
      console.log(`\n... and ${errors.length - 20} more errors`);
    }
  }
}

// Usage
await validateDataTypes("/data/users.csv", [
  { name: "id", type: "number", required: true },
  { name: "email", type: "email", required: true },
  { name: "created_at", type: "date", required: true },
  { name: "age", type: "number" }
]);
```

## Data Analysis

### Calculate Statistics

Compute statistical summary:

```typescript
async function calculateStats(csvFile: string, columnName: string) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  let columnIndex = -1;
  const values: number[] = [];

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      columnIndex = headers.indexOf(columnName);

      if (columnIndex === -1) {
        throw new Error(`Column "${columnName}" not found`);
      }

      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      const cols = line.split(",");
      const value = parseFloat(cols[columnIndex]);

      if (!isNaN(value)) {
        values.push(value);
      }
    }
  }

  // Calculate statistics
  values.sort((a, b) => a - b);

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;
  const median = values[Math.floor(values.length / 2)];
  const min = values[0];
  const max = values[values.length - 1];

  // Standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  console.log(`=== Statistics for "${columnName}" ===\n`);
  console.log(`Count: ${values.length}`);
  console.log(`Mean: ${mean.toFixed(2)}`);
  console.log(`Median: ${median.toFixed(2)}`);
  console.log(`Std Dev: ${stdDev.toFixed(2)}`);
  console.log(`Min: ${min.toFixed(2)}`);
  console.log(`Max: ${max.toFixed(2)}`);
  console.log(`Range: ${(max - min).toFixed(2)}`);
}

await calculateStats("/data/sales.csv", "amount");
```

### Group By and Aggregate

Calculate aggregates by category:

```typescript
async function groupByAndSum(
  csvFile: string,
  groupColumn: string,
  sumColumn: string
) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  let groupIdx = -1;
  let sumIdx = -1;

  const groups = new Map<string, number>();

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      groupIdx = headers.indexOf(groupColumn);
      sumIdx = headers.indexOf(sumColumn);

      if (groupIdx === -1 || sumIdx === -1) {
        throw new Error("Column not found");
      }

      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      const cols = line.split(",");
      const groupKey = cols[groupIdx].trim();
      const value = parseFloat(cols[sumIdx]);

      if (!isNaN(value)) {
        groups.set(groupKey, (groups.get(groupKey) || 0) + value);
      }
    }
  }

  // Display results
  console.log(`=== ${sumColumn} by ${groupColumn} ===\n`);

  Array.from(groups.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([key, sum]) => {
      console.log(`${key}: ${sum.toFixed(2)}`);
    });
}

await groupByAndSum("/data/sales.csv", "category", "amount");
```

## Data Transformation

### Filter and Export

Filter rows and write to new file:

```typescript
async function filterCsv(
  inputFile: string,
  outputFile: string,
  predicate: (row: Record<string, string>) => boolean
) {
  const stream = stream_large_file({
    filePath: inputFile,
    chunkSize: 1000
  });

  const writer = fs.createWriteStream(outputFile);
  let headers: string[] = [];
  let isFirstChunk = true;
  let filteredCount = 0;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      writer.write(lines[0] + "\n"); // Write headers
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      const values = line.split(",");
      const row = Object.fromEntries(
        headers.map((h, i) => [h, values[i]])
      );

      if (predicate(row)) {
        writer.write(line + "\n");
        filteredCount++;
      }
    }
  }

  writer.end();

  console.log(`Filtered ${filteredCount} rows to ${outputFile}`);
}

// Usage: Export only completed transactions
await filterCsv(
  "/data/transactions.csv",
  "/data/completed.csv",
  row => row.status === "completed"
);
```

### Transform Columns

Apply transformations to columns:

```typescript
async function transformCsv(
  inputFile: string,
  outputFile: string,
  transforms: Record<string, (value: string) => string>
) {
  const stream = stream_large_file({
    filePath: inputFile,
    chunkSize: 1000
  });

  const writer = fs.createWriteStream(outputFile);
  let headers: string[] = [];
  let isFirstChunk = true;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      writer.write(lines[0] + "\n");
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      const values = line.split(",");

      const transformed = values.map((value, idx) => {
        const header = headers[idx];
        if (transforms[header]) {
          return transforms[header](value);
        }
        return value;
      });

      writer.write(transformed.join(",") + "\n");
    }
  }

  writer.end();
}

// Usage: Normalize data
await transformCsv(
  "/data/users.csv",
  "/data/users_normalized.csv",
  {
    email: email => email.toLowerCase(),
    name: name => name.trim().toUpperCase(),
    created_at: date => new Date(date).toISOString()
  }
);
```

## Data Quality

### Find Duplicates

Detect duplicate rows:

```typescript
async function findDuplicates(
  csvFile: string,
  keyColumns: string[]
) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  const seen = new Map<string, number[]>();
  let currentRow = 0;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      currentRow++;
      const values = line.split(",");

      // Create key from specified columns
      const keyIndices = keyColumns.map(col => headers.indexOf(col));
      const key = keyIndices.map(idx => values[idx]).join("|");

      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(currentRow);
    }
  }

  // Find duplicates
  const duplicates = Array.from(seen.entries())
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({ key, rows }));

  console.log(`=== Duplicate Analysis ===\n`);
  console.log(`Total rows: ${currentRow}`);
  console.log(`Unique: ${seen.size}`);
  console.log(`Duplicates: ${duplicates.length}\n`);

  if (duplicates.length > 0) {
    console.log("Top duplicates:");
    duplicates
      .sort((a, b) => b.rows.length - a.rows.length)
      .slice(0, 10)
      .forEach(({ key, rows }) => {
        console.log(`${key}: ${rows.length} occurrences at rows ${rows.join(", ")}`);
      });
  }
}

await findDuplicates("/data/users.csv", ["email"]);
```

### Check Data Completeness

Analyze missing values:

```typescript
async function analyzeCompleteness(csvFile: string) {
  const stream = stream_large_file({
    filePath: csvFile,
    chunkSize: 1000
  });

  let headers: string[] = [];
  let isFirstChunk = true;
  const missing = new Map<string, number>();
  let totalRows = 0;

  for await (const chunk of stream) {
    const lines = chunk.lines.filter(line => line.trim());

    if (isFirstChunk) {
      headers = lines[0].split(",").map(h => h.trim());
      headers.forEach(h => missing.set(h, 0));
      lines.shift();
      isFirstChunk = false;
    }

    for (const line of lines) {
      totalRows++;
      const values = line.split(",");

      values.forEach((value, idx) => {
        if (!value.trim()) {
          const header = headers[idx];
          missing.set(header, (missing.get(header) || 0) + 1);
        }
      });
    }
  }

  // Report
  console.log(`=== Data Completeness ===\n`);
  console.log(`Total rows: ${totalRows}\n`);

  Array.from(missing.entries())
    .sort(([, a], [, b]) => b - a)
    .forEach(([column, count]) => {
      const percent = ((count / totalRows) * 100).toFixed(1);
      console.log(`${column}: ${count} missing (${percent}%)`);

      if (count / totalRows > 0.1) {
        console.log(`  ⚠ High missing rate`);
      }
    });
}

await analyzeCompleteness("/data/dataset.csv");
```

## Best Practices

### 1. Always Use Streaming for Large Files

```typescript
// Good: Streaming approach
async function processLargeCsv(file: string) {
  const stream = stream_large_file({
    filePath: file,
    chunkSize: 1000
  });

  for await (const chunk of stream) {
    await processChunk(chunk.lines);
  }
}

// Bad: Loading entire file
const allData = fs.readFileSync(file, "utf-8").split("\n");
```

### 2. Handle Headers Correctly

```typescript
let isFirstChunk = true;
let headers: string[] = [];

for await (const chunk of stream) {
  let lines = chunk.lines;

  if (isFirstChunk) {
    headers = lines[0].split(",");
    lines = lines.slice(1); // Remove header
    isFirstChunk = false;
  }

  // Process data rows
}
```

### 3. Validate Before Processing

```typescript
// Validate structure first
await validateCsvStructure(file);

// Then process
await processCsv(file);
```

## See Also

- [API Reference](/api/reference) - All available tools
- [stream_large_file](/api/stream) - Streaming documentation
- [Log Analysis](/examples/log-analysis) - Log processing examples
- [Performance Guide](/guide/performance) - Optimization tips
- [Best Practices](/guide/best-practices) - Usage recommendations
