# Minsky Mods - Clean Setup Summary

## What We Found

### ✅ Issues Identified

1. **Legacy `patches/` directories** - from old file-replacement system (not used)
2. **Missing `package.json` and `tsconfig.json`** in csv-export, llm-assist, scenario-loader
3. **Outdated README files** - referencing old install.js/uninstall.js scripts
4. **Personal `.claude/` directories** - should be in .gitignore
5. **No .gitignore file** in repository

### 📚 Documentation Created

1. **`docs/MOD_CREATION_WORKFLOW.md`** - Complete guide to creating clean mods
2. **`docs/LEGACY_CLEANUP_REPORT.md`** - Detailed report of legacy issues
3. **`docs/SETUP_SUMMARY.md`** (this file) - Quick reference

### 🛠️ Scripts Created

1. **`scripts/cleanup-legacy.sh`** - Automated cleanup of legacy files
2. **`scripts/create-mod.sh`** - Scaffold new mods with correct structure

## Quick Start: Creating a New Mod

```bash
# Method 1: Use the generator script
cd /path/to/minsky-mods
bash scripts/create-mod.sh my-new-mod "Brief description"

# Method 2: Manual creation
# See docs/MOD_CREATION_WORKFLOW.md for step-by-step guide
```

## Quick Start: Cleaning Up Legacy Files

```bash
# Preview what will be removed (dry run)
bash scripts/cleanup-legacy.sh

# Actually remove legacy files
bash scripts/cleanup-legacy.sh --apply

# Then commit the cleanup
git add -A
git commit -m "chore: Remove legacy patches and outdated files"
```

## Recommended Cleanup Steps

### 1. Remove Legacy Files (High Priority)

```bash
bash scripts/cleanup-legacy.sh --apply
```

This removes:
- `patches/` directories (old system)
- `.claude/` directories (personal settings)
- Creates `.gitignore`

### 2. Fix Missing Files (Medium Priority)

For each incomplete mod (csv-export, llm-assist, scenario-loader):

```bash
# Copy template files from scenario-grower
cp scenario-grower/package.json csv-export/package.json
cp scenario-grower/tsconfig.json csv-export/tsconfig.json

# Edit to match mod name
# Change: "@minsky/scenario-grower" → "@minsky/csv-export"
```

### 3. Update READMEs (Medium Priority)

Update all README.md files that mention:
- ❌ `install.js` / `uninstall.js`
- ❌ `.bak` files
- ❌ "automated install/uninstall"

Should reference:
- ✅ `/path/to/minsky/modding/tools/install-mod.js`

### 4. Standardize Structure (Low Priority)

Ensure each mod has:
```
my-mod/
├── package.json       ✅ Required
├── manifest.json      ✅ Required
├── tsconfig.json      ✅ Recommended
├── README.md          ✅ Required
├── docs/              ⚠️  Optional
│   └── ARCHITECTURE.md
└── src/
    ├── index.ts       ✅ Required
    └── lib/           ✅ Required
```

## Creating Your First Clean Mod

### Example: Create a "Variable Inspector" Mod

```bash
cd /path/to/minsky-mods

# Create the mod
bash scripts/create-mod.sh variable-inspector "Inspect and analyze model variables"

# Install into Minsky
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/variable-inspector

# Test in Minsky
cd /path/to/minsky/gui-js
bun start
```

Then navigate to **Simulation → Variable Inspector...**

## Key Rules for Clean Mods

### ✅ DO:
- Use `@minsky/<mod-name>` for package name
- Export only frontend code from `src/index.ts`
- Include `file` property in manifest.json routes
- Use central installer: `modding/tools/install-mod.js`
- Keep backend IPC handlers separate
- Match Angular Material styling

### ❌ DON'T:
- Export `ipc-handlers.ts` from `src/index.ts`
- Create `install.js` / `uninstall.js` scripts
- Include `patches/` directory
- Hardcode popup dimensions
- Include `.claude/` in git
- Create `.bak` files

## File Structure Reference

### Minimal Mod (No Backend)
```
my-mod/
├── package.json
├── manifest.json
├── README.md
└── src/
    ├── index.ts
    └── lib/
        ├── my-mod.module.ts
        ├── my-mod.component.ts
        ├── my-mod.component.html
        └── my-mod.component.scss
```

### Full Mod (With Backend)
```
my-mod/
├── package.json
├── manifest.json
├── tsconfig.json
├── README.md
├── docs/
│   └── ARCHITECTURE.md
└── src/
    ├── index.ts              # Frontend exports only
    └── lib/
        ├── my-mod.module.ts
        ├── my-mod.component.ts
        ├── my-mod.component.html
        ├── my-mod.component.scss
        ├── my-mod.service.ts
        └── ipc-handlers.ts   # NOT exported from index.ts
```

## Testing Checklist

After creating a mod:

- [ ] `package.json` has correct `@minsky/<name>`
- [ ] `manifest.json` has correct `file` paths
- [ ] `src/index.ts` exports frontend only
- [ ] No `patches/` directory
- [ ] No `.claude/` committed
- [ ] README has correct install instructions
- [ ] Mod installs without errors:
  ```bash
  node install-mod.js /path/to/mod
  ```
- [ ] Minsky builds without errors:
  ```bash
  cd gui-js && bun start
  ```
- [ ] Menu item appears in correct location
- [ ] Component loads when menu clicked

## Common Issues

### Issue: "Cannot find module '@minsky/my-mod'"

**Cause:** Mod not installed or path mapping incorrect

**Fix:**
```bash
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/my-mod
```

### Issue: "ERROR in ./src/index.ts - Module not found: 'electron'"

**Cause:** `ipc-handlers.ts` exported from `src/index.ts`

**Fix:** Remove the export of ipc-handlers from index.ts

### Issue: Route not found / Component not loading

**Cause:** Incorrect `file` path in manifest.json

**Fix:** Ensure file path is exact: `"src/lib/my-mod.module"` (no `.ts`)

### Issue: Changes not reflected in Minsky

**Cause:** Mod not reinstalled after changes

**Fix:**
```bash
cd /path/to/minsky/modding/tools
node install-mod.js /path/to/minsky-mods/my-mod
cd /path/to/minsky/gui-js
bun start  # Restart Minsky
```

## Resources

- **Full workflow guide:** `docs/MOD_CREATION_WORKFLOW.md`
- **Legacy cleanup report:** `docs/LEGACY_CLEANUP_REPORT.md`
- **Cleanup script:** `scripts/cleanup-legacy.sh`
- **Mod generator:** `scripts/create-mod.sh`
- **Example mods:** `scenario-grower/`, `scenario-raveler/`
- **Minsky modding docs:** `/path/to/minsky/modding/docs/ARCHITECTURE.md`

## Next Steps

1. **Clean up legacy files:**
   ```bash
   bash scripts/cleanup-legacy.sh --apply
   ```

2. **Create your first mod:**
   ```bash
   bash scripts/create-mod.sh my-first-mod "My first clean mod"
   ```

3. **Install and test:**
   ```bash
   cd /path/to/minsky/modding/tools
   node install-mod.js /path/to/minsky-mods/my-first-mod
   ```

4. **Read the full guide:**
   ```bash
   cat docs/MOD_CREATION_WORKFLOW.md
   ```

---

**Need help?** Check the example mods or refer to the workflow guide!
