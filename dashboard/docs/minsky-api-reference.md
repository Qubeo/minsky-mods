# Minsky C++ Backend API Reference

This document describes the key API patterns for interacting with the Minsky C++ backend via the native addon.

## Native Addon Loading

The addon is located at:
```
minsky/gui-js/build/minskyRESTService.node
```

Load with:
```typescript
const addon = require('/path/to/minskyRESTService.node');
```

## API Calling Convention

The addon exposes a `call` method that accepts REST-style commands:

```typescript
// Async (returns Promise)
const result = await addon.call('minsky.command', '[]');

// Sync (add .$sync suffix)
const result = addon.call('minsky.command.$sync', '[]');
```

Arguments are passed as JSON strings. Results are returned as JSON strings.

## Key Commands

### System
| Command | Args | Description |
|---------|------|-------------|
| `minsky.minskyVersion` | `[]` | Get version string |
| `minsky.load` | `["/path/to/file.mky"]` | Load model file |
| `minsky.save` | `["/path/to/file.mky"]` | Save model file |

### Simulation
| Command | Args | Description |
|---------|------|-------------|
| `minsky.t` | `[]` | Get current simulation time |
| `minsky.t` | `[value]` | Set simulation time |
| `minsky.reset` | `[]` | Reset simulation to t=0 |
| `minsky.step` | `[]` | Run one integration step |
| `minsky.stepMin` | `[]` | Get minimum step size |
| `minsky.stepMax` | `[]` | Get maximum step size |
| `minsky.nSteps` | `[]` | Get number of steps per run |

### Variables
| Command | Args | Description |
|---------|------|-------------|
| `minsky.variableValues.@keys` | `[]` | Get all variable names |
| `minsky.variableValues.@elem."name".value` | `[]` | Get variable value by name |

## Variable Name Conventions

Variable names returned from `variableValues.@keys` may include prefixes:
- `:name` - Internal/system variables (filter these out for user display)
- `stock:name` - Stock variables
- `parameter:name` - Parameters
- `constant:name` - Constants
- Plain names - Flow variables

## Callbacks (Optional)

The addon supports callbacks for UI integration:

```typescript
addon.setMessageCallback((msg, buttons) => { ... });
addon.setBusyCursorCallback((busy) => { ... });
addon.setProgressCallback((title, percent) => { ... });
addon.setBookmarkRefreshCallback(() => { ... });
addon.setResetScrollCallback(() => { ... });
```

These are optional for headless operation.

## Example Usage

```typescript
const addon = require('/path/to/minskyRESTService.node');

// Get version
const version = JSON.parse(addon.call('minsky.minskyVersion.$sync', '[]'));

// Load model
addon.call('minsky.load.$sync', JSON.stringify(['/path/to/model.mky']));

// Reset simulation
addon.call('minsky.reset.$sync', '[]');

// Run 100 steps
for (let i = 0; i < 100; i++) {
  addon.call('minsky.step.$sync', '[]');
  const t = JSON.parse(addon.call('minsky.t.$sync', '[]'));
  console.log('t =', t);
}

// Get variable value
const value = JSON.parse(
  addon.call('minsky.variableValues.@elem."GDP".value.$sync', '[]')
);
```

## Performance Notes

- Sync API is fast (~0.3ms per call)
- Async API may hang if callbacks aren't configured
- For web servers, sync API is recommended (server stays running anyway)
- Single-threaded: only one simulation can run at a time
