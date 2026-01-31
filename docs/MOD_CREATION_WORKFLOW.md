# Clean Mod Creation Workflow

## Legacy Issues Found

### ❌ What's Legacy (Should Be Removed)

1. **`patches/` directories** in scenario-grower, scenario-raveler, scenario-loader
   - These are from the OLD file-replacement approach
   - NOT used in current copy-to-libs/mods system
   - **Action**: Delete these directories

2. **Outdated READMEs** mentioning:
   - `install.js` / `uninstall.js` scripts
   - `.bak` file restoration
   - "file replacement" approach
   - **Action**: Rewrite to reference new installer

3. **Missing core files** in csv-export, llm-assist, scenario-loader:
   - Missing `package.json`
   - Missing `tsconfig.json`
   - **Action**: Add these files

4. **`.claude/` directories** (optional cleanup):
   - Personal Claude Code settings
   - **Action**: Add to .gitignore or keep if team uses same settings

## ✅ Clean Mod Structure (The Standard)

```
my-new-mod/
├── package.json              # Required: @minsky/my-new-mod
├── manifest.json             # Required: Menus, routes, IPC
├── tsconfig.json             # Recommended: IDE support
├── README.md                 # Required: User-facing docs
├── docs/                     # Optional: Technical documentation
│   ├── ARCHITECTURE.md       # Recommended for complex mods
│   └── *.md                  # Other docs as needed
├── src/
│   ├── index.ts              # Required: Frontend exports ONLY
│   └── lib/
│       ├── my-mod.module.ts     # Required: Angular module
│       ├── my-mod.component.ts  # Required: Main component
│       ├── my-mod.component.html
│       ├── my-mod.component.scss
│       ├── my-mod.service.ts    # Optional: Services
│       └── ipc-handlers.ts      # Optional: Backend (NOT exported from index.ts)
└── data/                     # Optional: Test data, examples

# DO NOT INCLUDE:
# - patches/ directory
# - install.js / uninstall.js scripts
# - .bak files
# - .claude/ (add to .gitignore)
```

## Step-by-Step: Creating a New Mod

### 1. Create Directory Structure

```bash
MOD_NAME="my-new-mod"
mkdir -p "$MOD_NAME/src/lib"
mkdir -p "$MOD_NAME/docs"
cd "$MOD_NAME"
```

### 2. Create package.json

```json
{
  "name": "@minsky/my-new-mod",
  "version": "1.0.0",
  "description": "Brief description of what this mod does",
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

### 3. Create manifest.json

```json
{
  "id": "my-new-mod",
  "name": "My New Mod",
  "version": "1.0.0",
  "contributes": {
    "menus": {
      "items": [
        {
          "menu": "simulation",
          "label": "My Feature...",
          "command": "my-new-mod.open"
        }
      ]
    },
    "commands": [
      {
        "id": "my-new-mod.open",
        "route": "my-feature",
        "window": {
          "width": 800,
          "height": 600,
          "title": "My Feature"
        }
      }
    ],
    "routes": [
      {
        "path": "my-feature",
        "module": "MyNewModModule",
        "file": "src/lib/my-new-mod.module"
      }
    ],
    "ipc": []
  }
}
```

**Important Notes:**
- `file` path must be exact: `"src/lib/my-new-mod.module"` (no `.ts` extension)
- Module name must match Angular module export
- Add IPC channels only if you need backend communication

### 4. Create tsconfig.json (Optional but Recommended)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5. Create Angular Module (src/lib/my-new-mod.module.ts)

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyNewModComponent } from './my-new-mod.component';

const routes: Routes = [
  { path: '', component: MyNewModComponent }
];

@NgModule({
  declarations: [MyNewModComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class MyNewModModule {}
```

### 6. Create Component (src/lib/my-new-mod.component.ts)

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'minsky-my-new-mod',
  templateUrl: './my-new-mod.component.html',
  styleUrls: ['./my-new-mod.component.scss']
})
export class MyNewModComponent {
  constructor() {}
}
```

### 7. Create Template (src/lib/my-new-mod.component.html)

```html
<div class="mod-container">
  <h1>My New Mod</h1>
  <p>Mod content goes here</p>
</div>
```

### 8. Create Styles (src/lib/my-new-mod.component.scss)

```scss
.mod-container {
  padding: 20px;
}
```

### 9. Create Frontend Barrel Export (src/index.ts)

```typescript
// Export Angular modules and components
export { MyNewModModule } from './lib/my-new-mod.module';
export { MyNewModComponent } from './lib/my-new-mod.component';

// DO NOT export ipc-handlers here!
// They contain Node.js modules and will break browser bundle
```

### 10. Create README.md

```markdown
# My New Mod

Brief description of what this mod does.

## Installation

Install this mod into Minsky:

\`\`\`bash
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/my-new-mod
\`\`\`

Then rebuild/restart Minsky:

\`\`\`bash
cd /path/to/minsky/gui-js
bun start
\`\`\`

## Usage

1. Open Minsky
2. Go to **Simulation → My Feature...**
3. Use the feature

## Features

- Feature 1
- Feature 2

## Development

After making changes, reinstall:

\`\`\`bash
node install-mod.js /path/to/minsky-mods/my-new-mod
\`\`\`
```

## Installing the Mod

```bash
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/my-new-mod
```

This will:
1. Copy mod to `gui-js/libs/mods/my-new-mod`
2. Add TypeScript path mappings
3. Generate integration config

## Testing

```bash
cd /path/to/minsky/gui-js
bun start
```

Open Minsky and navigate to your menu item.

## Common Pitfalls to Avoid

1. ❌ **Exporting ipc-handlers from index.ts**
   - This pulls Node.js into browser bundle
   - Keep backend code separate

2. ❌ **Wrong file path in manifest.json routes**
   - Must be exact: `"src/lib/my-mod.module"`
   - No `.ts` extension

3. ❌ **Creating install.js/uninstall.js scripts**
   - Use the central installer: `modding/tools/install-mod.js`

4. ❌ **Including patches/ directory**
   - Old approach, not used anymore

5. ❌ **Hardcoding paths**
   - Use relative imports and Angular routing

## Adding Backend IPC Handlers (Optional)

If you need backend functionality:

### 1. Add IPC channel to manifest.json

```json
"ipc": [
  { "channel": "my-new-mod:do-something" }
]
```

### 2. Create src/lib/ipc-handlers.ts

```typescript
import { ipcMain } from 'electron';

export function registerIpcHandlers() {
  ipcMain.handle('my-new-mod:do-something', async (event, data) => {
    // Backend logic here
    return { result: 'success' };
  });
}
```

### 3. Call from Component

```typescript
import { ElectronService } from '@minsky/core';

export class MyNewModComponent {
  constructor(private electron: ElectronService) {}

  async doSomething() {
    const result = await this.electron.ipcRenderer.invoke(
      'my-new-mod:do-something',
      { data: 'value' }
    );
  }
}
```

**Remember:** DO NOT export `ipc-handlers.ts` from `src/index.ts`!

## Summary Checklist

- [ ] package.json with correct name `@minsky/mod-name`
- [ ] manifest.json with correct routes and file paths
- [ ] tsconfig.json for IDE support
- [ ] README.md with installation instructions
- [ ] src/index.ts exports frontend only
- [ ] Angular module, component, template, styles
- [ ] No patches/ directory
- [ ] No install.js/uninstall.js scripts
- [ ] IPC handlers (if needed) not exported from index.ts
- [ ] Test installation with install-mod.js
