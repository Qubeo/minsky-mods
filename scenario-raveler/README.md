# Mod: Scenario Loader

Load parameter scenarios from CSV files through **Simulation → Load Scenario...** menu.

## Installation

This mod comes with automated install/uninstall scripts.

### To Install (on new Minsky instance)
1. Copy the `mod-scenario-loader` folder to `mods/`.
2. Run from repository root:
   ```bash
   node mods/mod-scenario-loader/install.js
   ```
3. Rebuild/Restart Minsky.

## Performance Optimization

For large models with thousands of variables, use the **Optimized Installer**:
```bash
node mods/mod-scenario-loader/install-opt.js
```
This reduces variable lookup time from seconds to milliseconds. See the [Performance Walkthrough](./docs/WALKTHROUGH_PERFORMANCE.md) for technical details and benchmarking.

### To Uninstall
1. Run from repository root:
   ```bash
   node mods/mod-scenario-loader/uninstall.js
   ```
   *Note: This restores files from `.bak` versions created during installation.*

## Implementation Details

The implementation follows the clean "Mod Side-Load" architecture:
-   **Source**: `mods/mod-scenario-loader/src/`
-   **Build Destination**: `gui-js/libs/mods/mod-scenario-loader/` (Managed by installer).

## Documentation

- **Performance Success Story**: [WALKTHROUGH_PERFORMANCE.md](./docs/WALKTHROUGH_PERFORMANCE.md)
- **Planning Doc**: [SCENARIO_LOADER_PLAN.md](./SCENARIO_LOADER_PLAN.md)
- **Base Changes**: [BASE_CHANGES.md](./BASE_CHANGES.md) (Core patches documentation)
- **Test CSV**: [test-scenario.csv](./test-scenario.csv)
- **Development Guide**: [DEV_WORKFLOW.md](../docs/DEV_WORKFLOW.md)

## CSV Format

```csv
Parameter,Units,Description,Conservative,Optimistic,Ideal
InnovationRate,1/year,Rate of innovation,0.02,0.04,0.06
```

| Column | Required | Description |
|--------|----------|-------------|
| Parameter | Yes | Variable name (without `:` prefix) |
| Units | No | Unit string (for documentation) |
| Description | No | Parameter description |
| Scenario1..N | Yes | Numeric values for each scenario |

## Usage

1. **Simulation → Load Scenario...**
2. Select a CSV file
3. Choose scenario from dropdown
4. Preview changes
5. Apply to model

## Files

See implementation in `gui-js/libs/mods/mod-scenario-loader/`:
- `src/lib/scenario-loader.component.ts` - Main wizard UI
- `src/lib/scenario-loader.service.ts` - Business logic
- `src/lib/utils/csv-parser.util.ts` - CSV parsing
- `src/lib/utils/variable-matcher.util.ts` - Variable matching
- `src/lib/dialogs/` - Dialog components
