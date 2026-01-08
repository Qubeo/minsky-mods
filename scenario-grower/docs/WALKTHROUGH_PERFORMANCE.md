
# Walkthrough - Performance Optimization for Large Models

## Goal
Resolve performance bottlenecks when loading scenarios into large Minsky models (thousands of variables), where the UI would hang or take excessive time.

## Diagnosis
- **Bottleneck**: The `variableValues.summarise()` API call fetches the full state (values, metadata) of ALL variables in the model.
- **Impact**: For large models, this results in a massive JSON payload and heavy IPC (Inter-Process Communication) overhead, even if the user only wants to match a few dozen CSV columns.
- **Timing**: Initial tests showed `summarise()` taking seconds to return, stalling the renderer.

## Solution
We implemented an **Optimized Variable Matcher** (`VariableMatcher.opt.ts`) that avoids `summarise()` entirely.

### Strategy: "Key Check & Fetch"
1.  **Fetch Keys Only**: Call `variableValues.keys()` to get a simple list of variable names (strings). This is extremely fast (ms vs seconds).
2.  **Local Match**: Iterate through the CSV columns and check if they exist in the keys list.
    - *Correction*: Fixed prefix matching logic to handle Minsky's `:` prefix for variables (e.g. matching `ChurnRate` to `:ChurnRate`).
3.  **Targeted Fetch**: For only the *matched* variables, use `variableValues.elem(name)` to create a proxy and fetch specific data (`init`, `valueId`) in parallel.
    - **Complexity**: Reduced from `O(TotalVariables)` to `O(CsvColumns)`.

## Implementation Details

### 1. New Source File
- `mods/mod-scenario-loader/src/lib/utils/variable-matcher.opt.ts`: The optimized matcher logic.

### 2. Experimental Installer (`install-opt.js`)
To allow A/B testing and keep the stable code logic intact, we created a specialized installer:
- **Command**: `node mods/mod-scenario-loader/install-opt.js`
- **Logic**: Installs the mod normally, then *overwrites* `variable-matcher.util.ts` with the Optimized version.
- **Reversion**: Running the standard `install.js` reverts to the stable (slower) matcher.

### 3. Additional Fixes
- **Metadata Update**: Existing variables (e.g. flows like `InnovationRate`) now correctly receive `Units` and `Description` updates from the CSV, not just values.
- **Creation Safety**: Added error handling to `createMissingVariables` to prevent crashes if a variable exists but wasn't matched (race condition or mismatch).

## Verification Results
- **User Confirmation**: "Good, this seems to work now!"
- **Performance**: Logs confirm `keys()` takes ~10ms where `summarise()` took seconds. Targeted processing is sub-millisecond.

## Documentation Consolidation
- **Update**: `BASE_CHANGES.md` was updated to remove manual revert steps and reflect the automated file-replacement strategy.
- **Consistency**: Verified that `DEV_WORKFLOW.md` and `README.md` (in `mods/docs`) correctly describe the "Copy-and-Patch" logic and the use of `restore_core.sh`.
- **Infrastructure**: All core file changes are now backed by manifest checksums, and reverting is a single command away (`restore_core.sh`).

## Artifacts
- **Source**: `mods/mod-scenario-loader/src/lib/utils/variable-matcher.opt.ts`
- **Installer**: `mods/mod-scenario-loader/install-opt.js`
- **Utility**: `mods/restore_core.sh`
- **Documentation**: Updated `mods/README.md` and `BASE_CHANGES.md`.
