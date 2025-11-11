# Code Navigation Examples

Navigate and analyze large codebases efficiently with Large File MCP Server.

## Overview

Large codebases can be challenging to navigate, especially when files contain thousands of lines. This guide shows practical patterns for code exploration, refactoring, and analysis.

## Basic Navigation

### Jump to Function Definition

Navigate to specific function with context:

```typescript
// Step 1: Find function definition
const results = await search_in_large_file({
  filePath: "/code/app.ts",
  pattern: "^export (async )?function processData",
  regex: true,
  contextAfter: 10
});

// Step 2: Navigate to definition for full view
const functionDef = await navigate_to_line({
  filePath: "/code/app.ts",
  lineNumber: results.matches[0].lineNumber,
  contextLines: 30
});

console.log("Function definition:");
console.log(functionDef.content);
console.log("\nFunction body:");
console.log(functionDef.contextAfter.join("\n"));
```

### Find All Function Definitions

List all functions in a file:

```typescript
async function listFunctions(codeFile: string) {
  const functions = await search_in_large_file({
    filePath: codeFile,
    pattern: "^(export\\s+)?(async\\s+)?function\\s+(\\w+)",
    regex: true,
    contextAfter: 3
  });

  console.log(`Found ${functions.totalMatches} functions:\n`);

  functions.matches.forEach(match => {
    // Extract function name
    const nameMatch = match.line.match(/function\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : "unknown";

    console.log(`${name} (line ${match.lineNumber})`);
    console.log(`  ${match.line}`);
    console.log();
  });
}

await listFunctions("/code/server.ts");
```

### Find Class Definitions

Locate and analyze classes:

```typescript
async function analyzeClasses(codeFile: string) {
  const classes = await search_in_large_file({
    filePath: codeFile,
    pattern: "^(export\\s+)?(abstract\\s+)?class\\s+(\\w+)",
    regex: true,
    contextAfter: 20
  });

  console.log(`Found ${classes.totalMatches} classes:\n`);

  for (const match of classes.matches) {
    const nameMatch = match.line.match(/class\s+(\w+)/);
    const className = nameMatch ? nameMatch[1] : "unknown";

    // Find methods in class
    const methods = match.contextAfter.filter(line =>
      /^\s+(public|private|protected)?\s*(async\s+)?\w+\s*\(/.test(line)
    );

    console.log(`Class: ${className} (line ${match.lineNumber})`);
    console.log(`Methods: ${methods.length}`);
    methods.forEach(method => {
      console.log(`  - ${method.trim()}`);
    });
    console.log();
  }
}

await analyzeClasses("/code/services.ts");
```

## Code Analysis

### Find TODO Comments

Track technical debt and pending work:

```typescript
async function findTodos(directory: string) {
  const files = await glob("**/*.ts", { cwd: directory });

  const todos: Array<{
    file: string;
    line: number;
    content: string;
    priority: string;
  }> = [];

  for (const file of files) {
    const results = await search_in_large_file({
      filePath: path.join(directory, file),
      pattern: "//\\s*TODO|//\\s*FIXME|//\\s*HACK",
      regex: true,
      contextAfter: 2
    });

    results.matches.forEach(match => {
      const priority = match.line.includes("FIXME")
        ? "HIGH"
        : match.line.includes("HACK")
        ? "MEDIUM"
        : "LOW";

      todos.push({
        file,
        line: match.lineNumber,
        content: match.line.trim(),
        priority
      });
    });
  }

  // Group by priority
  console.log("=== TODO Items ===\n");
  ["HIGH", "MEDIUM", "LOW"].forEach(priority => {
    const items = todos.filter(t => t.priority === priority);
    if (items.length > 0) {
      console.log(`${priority} (${items.length}):`);
      items.forEach(item => {
        console.log(`  ${item.file}:${item.line}`);
        console.log(`    ${item.content}`);
      });
      console.log();
    }
  });
}

await findTodos("/code/src");
```

### Analyze Import Dependencies

Map file dependencies:

```typescript
async function analyzeDependencies(codeFile: string) {
  const imports = await search_in_large_file({
    filePath: codeFile,
    pattern: "^import.*from\\s+['\"](.+)['\"]",
    regex: true
  });

  const dependencies = {
    npm: new Set<string>(),
    local: new Set<string>()
  };

  imports.matches.forEach(match => {
    const pathMatch = match.line.match(/from\s+['"](.+)['"]/);
    if (pathMatch) {
      const importPath = pathMatch[1];
      if (importPath.startsWith(".")) {
        dependencies.local.add(importPath);
      } else {
        dependencies.npm.add(importPath);
      }
    }
  });

  console.log("=== Dependencies ===\n");
  console.log(`NPM packages (${dependencies.npm.size}):`);
  Array.from(dependencies.npm)
    .sort()
    .forEach(pkg => console.log(`  - ${pkg}`));

  console.log(`\nLocal imports (${dependencies.local.size}):`);
  Array.from(dependencies.local)
    .sort()
    .forEach(file => console.log(`  - ${file}`));
}

await analyzeDependencies("/code/app.ts");
```

### Find Unused Exports

Detect potentially unused code:

```typescript
async function findUnusedExports(directory: string) {
  const files = await glob("**/*.ts", { cwd: directory });

  // Step 1: Find all exports
  const exports = new Map<string, Set<string>>();

  for (const file of files) {
    const results = await search_in_large_file({
      filePath: path.join(directory, file),
      pattern: "^export\\s+(const|function|class|interface)\\s+(\\w+)",
      regex: true
    });

    const fileExports = new Set<string>();
    results.matches.forEach(match => {
      const nameMatch = match.line.match(/\s+(\w+)/g);
      if (nameMatch && nameMatch[1]) {
        fileExports.add(nameMatch[1].trim());
      }
    });

    exports.set(file, fileExports);
  }

  // Step 2: Find imports
  const imported = new Set<string>();

  for (const file of files) {
    const results = await search_in_large_file({
      filePath: path.join(directory, file),
      pattern: "import\\s+\\{([^}]+)\\}",
      regex: true
    });

    results.matches.forEach(match => {
      const namesMatch = match.line.match(/\{([^}]+)\}/);
      if (namesMatch) {
        const names = namesMatch[1].split(",").map(n => n.trim());
        names.forEach(name => imported.add(name));
      }
    });
  }

  // Step 3: Find unused
  console.log("=== Potentially Unused Exports ===\n");

  for (const [file, fileExports] of exports) {
    const unused = Array.from(fileExports).filter(
      exp => !imported.has(exp)
    );

    if (unused.length > 0) {
      console.log(`${file}:`);
      unused.forEach(name => console.log(`  - ${name}`));
      console.log();
    }
  }
}

await findUnusedExports("/code/src");
```

## Refactoring Support

### Find and Replace Pattern

Preview changes before applying:

```typescript
async function findAndReplace(
  codeFile: string,
  pattern: string,
  replacement: string
) {
  const matches = await search_in_large_file({
    filePath: codeFile,
    pattern,
    regex: true,
    contextBefore: 2,
    contextAfter: 2
  });

  console.log(`Found ${matches.totalMatches} occurrences:\n`);

  matches.matches.forEach(match => {
    console.log(`Line ${match.lineNumber}:`);
    console.log("Before:");
    console.log(match.contextBefore.join("\n"));
    console.log(`> ${match.line}`);
    console.log(match.contextAfter.join("\n"));

    console.log("\nAfter:");
    const replaced = match.line.replace(new RegExp(pattern), replacement);
    console.log(match.contextBefore.join("\n"));
    console.log(`> ${replaced}`);
    console.log(match.contextAfter.join("\n"));
    console.log("\n---\n");
  });

  console.log(`Total changes: ${matches.totalMatches}`);
}

await findAndReplace(
  "/code/app.ts",
  "var\\s+(\\w+)",
  "const $1"
);
```

### Extract Function Candidates

Find code duplication for refactoring:

```typescript
async function findDuplication(codeFile: string, minLines: number = 5) {
  const structure = await get_file_structure({
    filePath: codeFile
  });

  const lineHashes = new Map<string, number[]>();

  // Read file and hash line sequences
  const stream = stream_large_file({
    filePath: codeFile,
    chunkSize: 100
  });

  let currentLine = 0;

  for await (const chunk of stream) {
    for (const line of chunk.lines) {
      currentLine++;

      // Skip empty lines and comments
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//")) continue;

      // Create hash of normalized line
      const normalized = trimmed.replace(/\s+/g, " ");

      if (!lineHashes.has(normalized)) {
        lineHashes.set(normalized, []);
      }
      lineHashes.get(normalized)!.push(currentLine);
    }
  }

  // Find duplicated sequences
  console.log("=== Potential Duplication ===\n");

  for (const [line, occurrences] of lineHashes) {
    if (occurrences.length >= 3) {
      console.log(`Line appears ${occurrences.length} times:`);
      console.log(`"${line}"`);
      console.log(`At lines: ${occurrences.join(", ")}`);
      console.log();
    }
  }
}

await findDuplication("/code/utils.ts");
```

## Code Quality Checks

### Find Long Functions

Identify functions that may need refactoring:

```typescript
async function findLongFunctions(codeFile: string, maxLines: number = 50) {
  // Find all function starts
  const functions = await search_in_large_file({
    filePath: codeFile,
    pattern: "^\\s*(export\\s+)?(async\\s+)?function\\s+(\\w+)",
    regex: true,
    contextAfter: maxLines + 10
  });

  const longFunctions: Array<{
    name: string;
    line: number;
    estimatedLines: number;
  }> = [];

  functions.matches.forEach(match => {
    const nameMatch = match.line.match(/function\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : "unknown";

    // Estimate function length by finding closing brace
    let braceCount = 0;
    let lineCount = 0;
    let foundOpening = false;

    for (const line of [match.line, ...match.contextAfter]) {
      if (line.includes("{")) {
        braceCount++;
        foundOpening = true;
      }
      if (line.includes("}")) {
        braceCount--;
      }

      if (foundOpening) {
        lineCount++;
      }

      if (braceCount === 0 && foundOpening) {
        break;
      }
    }

    if (lineCount > maxLines) {
      longFunctions.push({
        name,
        line: match.lineNumber,
        estimatedLines: lineCount
      });
    }
  });

  console.log(`=== Long Functions (> ${maxLines} lines) ===\n`);
  longFunctions
    .sort((a, b) => b.estimatedLines - a.estimatedLines)
    .forEach(func => {
      console.log(`${func.name} (line ${func.line}): ~${func.estimatedLines} lines`);
    });
}

await findLongFunctions("/code/server.ts");
```

### Find Complex Conditions

Identify complex if statements:

```typescript
async function findComplexConditions(codeFile: string) {
  const conditions = await search_in_large_file({
    filePath: codeFile,
    pattern: "if\\s*\\([^)]*&&[^)]*&&",
    regex: true,
    contextBefore: 2,
    contextAfter: 3
  });

  console.log(`Found ${conditions.totalMatches} complex conditions:\n`);

  conditions.matches.forEach(match => {
    console.log(`Line ${match.lineNumber}:`);
    console.log(match.line);

    // Count conditions
    const conditionCount = (match.line.match(/&&/g) || []).length + 1;
    console.log(`Conditions: ${conditionCount}`);

    if (conditionCount > 3) {
      console.log("⚠ Consider extracting to helper function");
    }
    console.log();
  });
}

await findComplexConditions("/code/validation.ts");
```

### Check Error Handling

Verify try-catch coverage:

```typescript
async function analyzeErrorHandling(codeFile: string) {
  // Find async functions
  const asyncFunctions = await search_in_large_file({
    filePath: codeFile,
    pattern: "async\\s+function\\s+(\\w+)",
    regex: true,
    contextAfter: 30
  });

  console.log("=== Error Handling Analysis ===\n");

  asyncFunctions.matches.forEach(match => {
    const nameMatch = match.line.match(/function\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : "unknown";

    const hasTryCatch = match.contextAfter.some(line =>
      line.includes("try {") || line.includes("catch")
    );

    const hasErrorCheck = match.contextAfter.some(line =>
      line.includes(".catch(") || line.includes("if (error")
    );

    console.log(`${name} (line ${match.lineNumber}):`);

    if (hasTryCatch || hasErrorCheck) {
      console.log("  ✓ Has error handling");
    } else {
      console.log("  ⚠ Missing error handling");
    }
    console.log();
  });
}

await analyzeErrorHandling("/code/api.ts");
```

## Documentation

### Generate Function Signatures

Extract function signatures for documentation:

```typescript
async function generateSignatures(codeFile: string) {
  const functions = await search_in_large_file({
    filePath: codeFile,
    pattern: "^export\\s+(async\\s+)?function\\s+\\w+.*\\{",
    regex: true,
    contextBefore: 5
  });

  console.log("# API Reference\n");

  functions.matches.forEach(match => {
    // Extract JSDoc comment if exists
    const jsdoc = match.contextBefore
      .filter(line => line.trim().startsWith("*"))
      .map(line => line.trim())
      .join("\n");

    // Extract signature
    const signature = match.line.replace("{", "").trim();

    console.log("## " + signature);
    if (jsdoc) {
      console.log("\n" + jsdoc);
    }
    console.log();
  });
}

await generateSignatures("/code/api.ts");
```

## Best Practices

### 1. Use Regex for Precise Matching

```typescript
// Good: Precise regex
const results = await search_in_large_file({
  filePath: codeFile,
  pattern: "^export\\s+function\\s+(\\w+)",
  regex: true
});

// Bad: Loose string search
const results = await search_in_large_file({
  filePath: codeFile,
  pattern: "function",
  regex: false
});
```

### 2. Cache File Structure

```typescript
const structureCache = new Map();

async function getCachedStructure(file: string) {
  if (!structureCache.has(file)) {
    structureCache.set(file, await get_file_structure({ filePath: file }));
  }
  return structureCache.get(file);
}
```

### 3. Combine Search and Navigate

```typescript
// Step 1: Find
const results = await search_in_large_file({
  filePath: file,
  pattern: "class\\s+Database",
  regex: true
});

// Step 2: Navigate for full context
const fullContext = await navigate_to_line({
  filePath: file,
  lineNumber: results.matches[0].lineNumber,
  contextLines: 50
});
```

## See Also

- [API Reference](/api/reference) - All available tools
- [search_in_large_file](/api/search) - Search documentation
- [navigate_to_line](/api/navigate) - Navigation documentation
- [Log Analysis](/examples/log-analysis) - Log analysis examples
- [Best Practices](/guide/best-practices) - Usage recommendations
