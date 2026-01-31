# Minsky Mods Repository

External mods for extending Minsky's functionality.

## Tech Stack
- Runtime: Bun
- Language: TypeScript
- UI: Angular 17+ with Material

## Installation (into Minsky)
```bash
cd ../modding
bun tools/install-mod.js ../mods/scenario-grower
```

## Development
```bash
# Link node_modules to Minsky's (one-time)
ln -sf ../minsky/gui-js/node_modules node_modules

# After making changes, re-install the mod
cd ../modding
bun tools/install-mod.js ../mods/my-mod

# Test in Minsky
cd ../minsky/gui-js
bun start
```

## Mod Structure
```
my-mod/
├── package.json      # "@minsky/my-mod"
├── manifest.json     # Menu, routes, IPC declarations
├── tsconfig.json     # Optional, for IDE support
└── src/
    ├── index.ts      # Frontend exports only
    └── lib/
        ├── my-mod.module.ts
        ├── my-mod.component.ts
        └── ipc-handlers.ts  # Backend code
```

## Available Mods

| Mod | Purpose |
|-----|---------|
| scenario-grower | Build scenario infrastructure from CSV |
| scenario-raveler | Ravel-based scenario builder |
| scenario-loader | Load/save scenarios |
| csv-export | Export to CSV |
| llm-assist | LLM integration |

## Conventions
- Package name: `@minsky/<mod-id>`
- Keep separate from Minsky core (this repo is external)
- Frontend/backend code separation critical
- Match Minsky's Angular Material styling

## Key Gotchas
- **Never export ipc-handlers from index.ts** - pulls Node.js into browser
- **Manifest needs `file` property** - for route module paths
- **Re-install after changes** - mods are copied, not linked
