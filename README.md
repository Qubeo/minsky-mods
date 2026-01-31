# Minsky Mods

External mods for the [Minsky](https://github.com/highperformancecoder/minsky) system dynamics modeling application.

## Available Mods

| Mod | Description | Status |
|-----|-------------|--------|
| `scenario-grower` | Grow scenario infrastructure from CSV data | ✅ Working |
| `scenario-raveler` | Ravel-based scenario infrastructure builder | 🚧 In Progress |
| `scenario-loader` | Load/save scenario configurations | 🚧 In Progress |
| `csv-export` | Export model data to CSV | 🚧 In Progress |
| `llm-assist` | LLM-powered modeling assistance | 🚧 Experimental |

## Installation

Mods are installed into your Minsky installation using the mod installer:

```bash
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/scenario-grower
```

This will:
1. Copy the mod to `gui-js/libs/mods/`
2. Add TypeScript path mappings
3. Generate integration config

## Creating a New Mod

Each mod requires:

```
my-mod/
├── package.json          # Name must be "@minsky/my-mod"
├── manifest.json         # Declares menus, routes, IPC
└── src/
    ├── index.ts          # Barrel exports (frontend only)
    └── lib/
        ├── my-mod.module.ts
        ├── my-mod.component.ts
        └── ipc-handlers.ts   # Backend code (not exported from index)
```

### package.json

```json
{
  "name": "@minsky/my-mod",
  "version": "1.0.0",
  "description": "My mod description",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./src/lib/*": "./src/lib/*.ts",
    "./package.json": "./package.json"
  },
  "peerDependencies": {
    "@angular/core": ">=17.0.0",
    "@angular/common": ">=17.0.0",
    "@angular/router": ">=17.0.0"
  }
}
```

### manifest.json

```json
{
  "id": "my-mod",
  "name": "My Mod",
  "version": "1.0.0",
  "contributes": {
    "menus": {
      "items": [
        { "menu": "simulation", "label": "My Feature...", "command": "my-mod.open" }
      ]
    },
    "commands": [
      {
        "id": "my-mod.open",
        "route": "my-feature",
        "window": { "width": 800, "height": 600, "title": "My Feature" }
      }
    ],
    "routes": [
      { "path": "my-feature", "module": "MyModModule", "file": "src/lib/my-mod.module" }
    ],
    "ipc": [
      { "channel": "my-mod:do-something" }
    ]
  }
}
```

**Important**: The `file` property in routes must specify the direct path to the module file.

### index.ts (Frontend Exports Only)

```typescript
// Export Angular modules and components
export * from './lib/my-mod.service';
export * from './lib/my-mod.component';
export { MyModModule } from './lib/my-mod.module';

// DO NOT export ipc-handlers here - it would pull Node.js modules into browser bundle
```

## Development Workflow

1. Make changes to mod source
2. Re-run installer to copy updated files:
   ```bash
   node install-mod.js /path/to/minsky-mods/my-mod
   ```
3. Rebuild/restart Minsky:
   ```bash
   cd /path/to/minsky/gui-js
   bun start
   ```

## Architecture

See `/path/to/minsky/modding/docs/ARCHITECTURE.md` for detailed documentation on how the modding system works.

## Node Modules Symlink

The `node_modules` symlink in this directory points to the Minsky gui-js node_modules. This allows mods to resolve Angular and other dependencies during development without duplicating them.

```bash
ln -sf /path/to/minsky/gui-js/node_modules node_modules
```
