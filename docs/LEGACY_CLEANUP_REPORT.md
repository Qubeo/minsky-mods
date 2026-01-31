# Legacy Cleanup Report

## Issues Found

### 1. Legacy `patches/` Directories (OLD SYSTEM)

These contain files from the old "file replacement" approach. **Not used in current system.**

```
scenario-grower/patches/
├── ApplicationMenuManager.ts
├── electron.events.ts
├── electron.service.ts
├── simulation.module.ts
├── simulation-routing.module.ts
└── tsconfig.base.json

scenario-raveler/patches/
├── [same files]

scenario-loader/patches/
├── [same files]
```

**Action:** Delete all `patches/` directories

### 2. Missing Required Files

| Mod | Missing Files |
|-----|---------------|
| csv-export | package.json, tsconfig.json |
| llm-assist | package.json, tsconfig.json |
| scenario-loader | package.json, tsconfig.json |

**Action:** Create these files using templates from scenario-grower

### 3. Outdated README Files

The README in scenario-grower mentions:
- Old `install.js` / `uninstall.js` scripts
- `.bak` file restoration approach
- "automated install/uninstall scripts"

**Current system:** Uses central `modding/tools/install-mod.js`

**Action:** Update READMEs to reference new installer

### 4. Personal Settings in Repo

```
.claude/ directories in:
- scenario-grower
- scenario-raveler
- scenario-loader
```

**Action:** Either delete or add to `.gitignore` (team decision)

### 5. Test Data Directories

```
scenario-grower/data/ - 5 files (mky + csv)
scenario-raveler/data/ - 5 files (rvl + mky)
scenario-loader/data/ - empty
```

**Action:** Keep if used for testing, document purpose in README

## Cleanup Priority

### High Priority (Breaks Current System)
1. ✅ Delete `patches/` directories
2. ✅ Add missing package.json files
3. ✅ Update outdated READMEs

### Medium Priority (Maintenance)
1. ⚠️ Add missing tsconfig.json files
2. ⚠️ Document/clean data directories
3. ⚠️ Add .gitignore for .claude/

### Low Priority (Polish)
1. 📝 Standardize directory structure across all mods
2. 📝 Add docs/ARCHITECTURE.md where missing
3. 📝 Create example/template mod

## Automated Cleanup Script

See `scripts/cleanup-legacy.sh` for automated removal of legacy files.
