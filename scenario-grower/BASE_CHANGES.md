# Base Code Changes for mod-scenario-loader

## Files Replaced (Base Code)
These core Minsky files are replaced with pre-patched versions during installation. This strategy ensures zero-regex patching and avoids logic conflicts.

- **`tsconfig.base.json`**: Added path mapping for `@minsky/mod-scenario-loader`.
- **`libs/menu/src/lib/simulation/simulation-routing.module.ts`**: Added `load-scenario` route.
- **`libs/menu/src/lib/simulation/simulation.module.ts`**: Integrated `ScenarioLoaderComponent`.
- **`apps/minsky-electron/src/app/managers/ApplicationMenuManager.ts`**: Registered "Load Scenario..." simulation menu item.
- **`libs/core/src/lib/services/electron/electron.service.ts`**: Added `readFileText` IPC handler for large CSV support.
- **`apps/minsky-electron/src/app/events/electron.events.ts`**: Registered backend IPC events for file system access.

## Reverting Changes
The mod installation is reversible using automated scripts:

1. **Restore Core**: Run `mods/restore_core.sh` to revert all core files to their original state from Git.
2. **Uninstall Mod**: Run `node mods/mod-scenario-loader/uninstall.js` to remove the mod source from `gui-js`.

## Performance Investigation
To diagnose slow variable loading (equations/summary), we have instrumented the mod with `console.time()` logging:
- `Minsky:variableValues.summarise`: Measures backend response time for fetching all variables.
- `Mod:VariableMatcher.processing`: Measures local processing time.
- `Mod:createMissingVariables`: Measures time to create and position variables on canvas.

These logs appear in the Electron Developer Tools console.

## Performance Optimization (Experimental)
A new optimization has been implemented to address performance issues with large models (many variables).
- **Issue**: `variableValues.summarise()` fetches the entire state of all variables, causing massive IPC overhead and hanging the UI.
- **Solution**: We now use `variableValues.keys()` to check for existence (names only) and `variableValues.elem(name)` to fetch details for *only* the mapped variables.
- **Result**: Data transfer reduced from O(AllVars) to O(CsvColumns).
- **Usage**: Run `node mods/mod-scenario-loader/install-opt.js` to apply this optimization.
