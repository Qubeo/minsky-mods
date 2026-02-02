# Minsky C++ Backend API Reference

This document describes the key API patterns for interacting with the Minsky C++ backend via the native addon (`minskyRESTService.node`).

## Table of Contents

- [Native Addon Loading](#native-addon-loading)
- [API Calling Convention](#api-calling-convention)
- [Key Commands](#key-commands)
  - [System](#system)
  - [Simulation](#simulation)
  - [Variables](#variables)
- [Variable Name Conventions](#variable-name-conventions)
- [Callbacks (Optional)](#callbacks-optional)
- [Example Usage](#example-usage)
- [Performance Notes](#performance-notes)
- [Troubleshooting](#troubleshooting)

---

## Native Addon Loading

The addon is located at:
```
minsky/gui-js/build/minskyRESTService.node
```

Load with Node.js or Bun:
```typescript
const addon = require('/path/to/minskyRESTService.node');
```

Or with `bindings` package:
```typescript
import bindings from 'bindings';
const addon = bindings('minskyRESTService.node');
```

---

## API Calling Convention

The addon exposes a `call` method that accepts REST-style commands:

```typescript
// Async (returns Promise) - requires callbacks to be configured
const result = await addon.call('minsky.command', '[arg1, arg2]');

// Sync (add .$sync suffix) - recommended for web servers
const result = addon.call('minsky.command.$sync', '[arg1, arg2]');
```

**Important Notes:**
- Arguments are passed as JSON strings: `JSON.stringify([arg1, arg2])`
- Results are returned as JSON strings: `JSON.parse(result)`
- For single arguments, you can pass `JSON.stringify(arg)` directly
- For no arguments, pass `'[]'`

---

## Key Commands

### System

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `minsky.minskyVersion` | `[]` | `string` | Get version string (e.g., "3.22.0-beta.2") |
| `minsky.load` | `["/path/to/file.mky"]` | `void` | Load model file from filesystem |
| `minsky.save` | `["/path/to/file.mky"]` | `void` | Save current model to file |

**Example:**
```typescript
const version = JSON.parse(addon.call('minsky.minskyVersion.$sync', '[]'));
// "3.22.0-beta.2"

addon.call('minsky.load.$sync', JSON.stringify(['/home/user/model.mky']));
```

### Simulation

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `minsky.t` | `[]` | `number` | Get current simulation time |
| `minsky.t` | `[value]` | `void` | Set simulation time |
| `minsky.reset` | `[]` | `void` | Reset simulation to t=0 |
| `minsky.step` | `[]` | `void` | Run one integration step |
| `minsky.stepMin` | `[]` | `number` | Get minimum step size |
| `minsky.stepMax` | `[]` | `number` | Get maximum step size |
| `minsky.nSteps` | `[]` | `number` | Get number of steps per run |

**Example:**
```typescript
// Reset and run 10 steps
addon.call('minsky.reset.$sync', '[]');

for (let i = 0; i < 10; i++) {
  addon.call('minsky.step.$sync', '[]');
  const t = JSON.parse(addon.call('minsky.t.$sync', '[]'));
  console.log(`Step ${i}: t = ${t}`);
}
```

### Variables

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `minsky.variableValues.@keys` | `[]` | `string[]` | Get all variable names |
| `minsky.variableValues.@elem."name".value` | `[]` | `number` | Get variable value by name |

**Example:**
```typescript
// Get all variable names
const keys = JSON.parse(addon.call('minsky.variableValues.@keys.$sync', '[]'));
// [":Investment", ":K", ":L", "constant:one", ...]

// Get value for a specific variable
const value = JSON.parse(
  addon.call('minsky.variableValues.@elem.":Y".value.$sync', '[]')
);
// 100.5
```

---

## Variable Name Conventions

Variable names returned from `variableValues.@keys` have different formats:

| Format | Example | Type | Display As |
|--------|---------|------|------------|
| `:name` | `:Investment` | Flow variable | "Investment" |
| `constant:name` | `constant:one` | Constant | "one" |
| `stock:name` | `stock:K` | Stock variable | "K" |
| `parameter:name` | `parameter:alpha` | Parameter | "alpha" |
| `12345:name` | `993733488:0` | Internal wiring | **Filter out** |

**Filtering Internal Variables:**

```typescript
function isUserVariable(key: string): boolean {
  const prefix = key.split(':')[0];
  // If prefix is a number, it's internal wiring
  return prefix === '' || isNaN(Number(prefix));
}

const keys = JSON.parse(addon.call('minsky.variableValues.@keys.$sync', '[]'));
const userVars = keys.filter(isUserVariable);
// [":Investment", ":K", "constant:one", ...] - no numeric prefixes
```

**Parsing Display Names:**

```typescript
function parseDisplayName(key: string): { name: string; type: string } {
  const colonIdx = key.indexOf(':');
  if (colonIdx === -1) {
    return { name: key, type: 'flow' };
  }

  const prefix = key.substring(0, colonIdx);
  const name = key.substring(colonIdx + 1);

  if (prefix === '') {
    // ":Name" format - regular variable
    return { name, type: 'flow' };
  }

  // "type:name" format
  const type = prefix === 'stock' ? 'stock' :
               prefix === 'parameter' ? 'parameter' :
               prefix === 'constant' ? 'constant' : 'flow';

  return { name, type };
}

parseDisplayName(':Investment');  // { name: "Investment", type: "flow" }
parseDisplayName('constant:one'); // { name: "one", type: "constant" }
```

---

## Callbacks (Optional)

The addon supports callbacks for UI integration. These are optional for headless/server operation:

```typescript
// Message dialog callback
addon.setMessageCallback((msg: string, buttons: string[]) => {
  // Show message dialog
  // Return button index clicked
  return 0;
});

// Busy cursor callback
addon.setBusyCursorCallback((busy: boolean) => {
  // Show/hide busy cursor
});

// Progress callback
addon.setProgressCallback((title: string, percent: number) => {
  // Update progress bar
  console.log(`${title}: ${percent}%`);
});

// Bookmark refresh callback
addon.setBookmarkRefreshCallback(() => {
  // Refresh bookmark list UI
});

// Reset scroll callback
addon.setResetScrollCallback(() => {
  // Reset scroll position
});

// Cancel progress
addon.cancelProgress(); // Call to cancel long-running operation
```

**Note:** If callbacks are not set, async operations may hang waiting for user input. Use sync API for servers.

---

## Example Usage

### Complete Workflow

```typescript
const addon = require('/path/to/minskyRESTService.node');

// 1. Get version
const version = JSON.parse(addon.call('minsky.minskyVersion.$sync', '[]'));
console.log('Minsky version:', version);

// 2. Load model
addon.call('minsky.load.$sync', JSON.stringify(['/path/to/model.mky']));

// 3. Reset simulation
addon.call('minsky.reset.$sync', '[]');

// 4. Get variable list
const keys = JSON.parse(addon.call('minsky.variableValues.@keys.$sync', '[]'));
const userVars = keys.filter(k => {
  const prefix = k.split(':')[0];
  return prefix === '' || isNaN(Number(prefix));
});

console.log('Variables:', userVars);

// 5. Run simulation and collect data
const history = [];
const varsToTrack = [':Y', ':K', ':L'];

for (let i = 0; i < 100; i++) {
  const t = JSON.parse(addon.call('minsky.t.$sync', '[]'));
  const point = { t };

  for (const varName of varsToTrack) {
    const value = JSON.parse(
      addon.call(`minsky.variableValues.@elem."${varName}".value.$sync`, '[]')
    );
    point[varName] = value;
  }

  history.push(point);
  addon.call('minsky.step.$sync', '[]');
}

console.log('Simulation complete. Final time:', history[history.length - 1].t);
console.log('Sample data:', history.slice(0, 5));
```

### Output Example

```json
Variables: [
  ":Investment", ":K", ":L", ":N", ":NAIRU",
  ":Profit", ":Y", "constant:one", "constant:zero"
]

Simulation complete. Final time: 6.96

Sample data: [
  { "t": 0, ":Y": 100, ":K": 300, ":L": 100 },
  { "t": 0.03, ":Y": 100.006, ":K": 300.018, ":L": 100.006 },
  { "t": 0.1, ":Y": 100.069, ":K": 300.207, ":L": 100.069 },
  { "t": 0.17, ":Y": 100.200, ":K": 300.601, ":L": 100.200 },
  { "t": 0.24, ":Y": 100.400, ":K": 301.201, ":L": 100.400 }
]
```

---

## Performance Notes

### Synchronous API (Recommended)
- **Speed**: ~0.3ms per call
- **Use case**: Web servers, CLI tools, batch processing
- **Pros**: Simple, fast, no callback setup needed
- **Cons**: Blocks event loop during long operations

### Asynchronous API
- **Speed**: Similar to sync, but returns Promise
- **Use case**: GUI applications with event loops
- **Pros**: Non-blocking for long operations
- **Cons**: Requires callback configuration, may hang if callbacks not set

### Simulation Performance
- **Single step**: ~0.1-1ms depending on model complexity
- **100 steps**: ~30-100ms
- **1000 steps**: ~300-1000ms
- **Data collection overhead**: ~0.05ms per variable per step

### Optimization Tips
1. **Batch variable reads**: Read all needed variables in one loop rather than multiple separate loops
2. **Filter variables early**: Don't fetch values for variables you won't use
3. **Use sync API**: Faster and simpler for server applications
4. **Limit tracked variables**: Chart only the variables you need to visualize

---

## Troubleshooting

### Common Issues

**Issue: `Error: Module did not self-register`**
- **Cause**: Node.js version mismatch or corrupted build
- **Solution**: Rebuild the addon with matching Node.js version

**Issue: `Command not found: .variableValues.@keys`**
- **Cause**: Incorrect command syntax or API path
- **Solution**: Check command format, ensure model is loaded first

**Issue: `key "varName" not found`**
- **Cause**: Variable doesn't exist in model or wrong name format
- **Solution**: Check exact variable name from `variableValues.@keys`, including colons

**Issue: Addon loads but calls hang**
- **Cause**: Using async API without callback setup
- **Solution**: Use sync API (add `.$sync` to command) or configure callbacks

**Issue: `Assertion failed` in addon**
- **Cause**: Invalid argument format or type
- **Solution**: Ensure arguments are JSON-encoded strings

### Debugging Tips

```typescript
// Log raw call and result
function debugCall(command: string, args: string): any {
  console.log('Call:', command, args);
  const result = addon.call(command, args);
  console.log('Result:', result);
  return JSON.parse(result);
}

// Test if addon is working
try {
  const version = debugCall('minsky.minskyVersion.$sync', '[]');
  console.log('✓ Addon working, version:', version);
} catch (e) {
  console.error('✗ Addon error:', e.message);
}

// List all available variables
const keys = debugCall('minsky.variableValues.@keys.$sync', '[]');
console.log('Found', keys.length, 'variables');
keys.forEach(k => console.log(' -', k));
```

---

## Advanced Topics

### Model Introspection

```typescript
// Get canvas items count
const itemCount = JSON.parse(
  addon.call('minsky.canvas.model.items.@size.$sync', '[]')
);

// Check if Ravel license expired
const expired = JSON.parse(
  addon.call('minsky.ravelExpired.$sync', '[]')
);
```

### Resource Management

```typescript
// Set icon resources (for GUI)
addon.call('minsky.setGodleyIconResource.$sync',
  JSON.stringify(['/path/to/godley.svg']));

addon.call('minsky.setGroupIconResource.$sync',
  JSON.stringify(['/path/to/group.svg']));
```

---

## API Versioning

This documentation is for Minsky version **3.22.0-beta.2**. API may change between versions.

To check compatibility:
```typescript
const version = JSON.parse(addon.call('minsky.minskyVersion.$sync', '[]'));
const [major, minor, patch] = version.split(/[.-]/).map(Number);

if (major < 3 || (major === 3 && minor < 22)) {
  console.warn('API may be incompatible with Minsky < 3.22');
}
```

---

## See Also

- [Minsky Dashboard README](../README.md) - Main project documentation
- [Minsky GitHub](https://github.com/highperformancecoder/minsky) - Source code
- [Minsky Wiki](https://minsky.sf.net) - User guide and tutorials
