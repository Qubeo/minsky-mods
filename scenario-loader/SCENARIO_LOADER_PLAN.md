# Scenario Parameter Loader Mod - Implementation Plan

## Overview

Create a mod that allows loading parameter scenarios from CSV files through the Simulation menu. Users can select different scenarios (e.g., Conservative, Optimistic, Ideal) and apply them to their model with validation and preview.

## User Requirements

- **UI Location**: Simulation → Load Scenario...
- **CSV Format**: `Parameter,Scenario1,Scenario2,...` (flexible number of scenarios)
- **Validation**: Check variable names, validate numeric values, show preview before applying
- **Missing Variables**: Show dialog listing missing variables, ask if user wants to create them as new parameters

## Architecture

**Mod Structure**: Standalone Angular module following Minsky modding patterns
**Integration Point**: Simulation menu with minimal base code changes
**Flow**: File selection → Scenario selection → Validation → Preview → Apply

## Implementation Steps

### 1. Scaffold the Mod (5 min)

```bash
cd /home/qubeo/prog/minsky-mod
./mods/tools/create-mod.sh scenario-loader
```

Creates: `gui-js/libs/mods/mod-scenario-loader/`

### 2. Create Data Models (10 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/models/scenario-data.model.ts`

```typescript
export interface ScenarioData {
  parameters: string[];           // First column: parameter names
  scenarios: ScenarioColumn[];    // Other columns: scenario data
}

export interface ScenarioColumn {
  name: string;                   // Scenario name from header
  values: (number | null)[];      // Values (null for invalid)
}

export interface ParameterMapping {
  csvName: string;                // Name from CSV
  modelName: string;              // Name in model (with : prefix if global)
  valueId: string;                // Minsky valueId
  currentValue: string;           // Current value in model
  newValue: number;               // New value from CSV
  matched: boolean;               // Whether found in model
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingVariables: string[];
  mappings: ParameterMapping[];
}
```

### 3. Create CSV Parser Utility (30 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/utils/csv-parser.util.ts`

**Key Features**:
- Simple comma-separated parser (no external dependencies)
- Handles quoted strings
- Parses numeric values, returns null for invalid
- Auto-detects scenario columns (numeric) vs. documentation columns (Units, Description)
- Ignores trailing non-numeric columns for documentation purposes
- Throws error on malformed CSV (no header, single column)

**Methods**:
```typescript
export class CsvParser {
  static parse(csvText: string): ScenarioData
  private static parseLine(line: string): string[]
  private static parseNumeric(value: string): number | null
}
```

### 4. Create Variable Matcher Utility (30 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/utils/variable-matcher.util.ts`

**Key Features**:
- Matches CSV parameter names to model variables
- Auto-tries both with/without `:` prefix for global variables
- Case-sensitive exact matching
- Validates numeric values

**Methods**:
```typescript
export class VariableMatcher {
  static async matchVariables(
    csvParameters: string[],
    scenarioName: string,
    scenarioValues: (number | null)[],
    electronService: ElectronService
  ): Promise<ParameterMapping[]>

  static validateMappings(mappings: ParameterMapping[]): ValidationResult
}
```

**Variable Matching Logic**:
```typescript
// Get all model variables
const variableSummary = await electronService.minsky.variableValues.summarise();

// Try exact match first
let matchedVar = variableSummary.find(v => v.name === csvName);

// Then try with : prefix
if (!matchedVar) {
  matchedVar = variableSummary.find(v => v.name === `:${csvName}`);
}
```

### 5. Create Service (30 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/scenario-loader.service.ts`

**Key Methods**:
```typescript
@Injectable({ providedIn: 'root' })
export class ScenarioLoaderService {
  async readCsvFile(filePath: string): Promise<string>
  parseScenarioData(csvText: string): ScenarioData
  async validateScenario(scenarioData: ScenarioData, scenarioName: string): Promise<ValidationResult>
  async applyScenario(mappings: ParameterMapping[]): Promise<void>
}
```

**Apply Scenario Logic**:
```typescript
async applyScenario(mappings: ParameterMapping[]): Promise<void> {
  for (const mapping of mappings) {
    if (mapping.matched && mapping.valueId) {
      await this.electronService.minsky.variableValues
        .elem(mapping.valueId)
        .init(mapping.newValue.toString());
    }
  }
}
```

### 6. Create Missing Variables Dialog (20 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/dialogs/missing-variables-dialog.component.ts`

**Features**:
- Lists all variables not found in model
- Asks user: "Create as new global parameters?"
- Two buttons: Cancel / Create Parameters

**Template**:
```html
<h2 mat-dialog-title>Missing Variables</h2>
<mat-dialog-content>
  <p>The following variables from the CSV were not found in the model:</p>
  <mat-list>
    <mat-list-item *ngFor="let varName of data.missingVariables">
      {{ varName }}
    </mat-list-item>
  </mat-list>
  <p>Would you like to create them as new global parameters?</p>
</mat-dialog-content>
<mat-dialog-actions>
  <button mat-button (click)="onCancel()">Cancel</button>
  <button mat-raised-button color="primary" (click)="onCreate()">Create Parameters</button>
</mat-dialog-actions>
```

### 7. Create Preview Dialog (30 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/dialogs/preview-dialog.component.ts`

**Features**:
- Shows table with columns: Parameter | Current Value | → | New Value
- Allows user to review all changes before applying
- Two buttons: Cancel / Apply Scenario

**Table Columns**:
```typescript
displayedColumns = ['parameter', 'oldValue', 'arrow', 'newValue'];
```

### 8. Create Main Component (1 hour)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/lib/scenario-loader.component.ts`

**Wizard Flow**:
1. **File Selection**: Browse for CSV file
2. **Scenario Selection**: Dropdown populated from CSV headers
3. **Validation**: Check for missing variables
4. **Missing Variables Dialog**: If any missing, ask to create
5. **Preview Dialog**: Show old → new values
6. **Apply**: Update model variables

**Key Methods**:
```typescript
async selectFile()                    // Open file dialog
async loadCsvFile()                   // Parse CSV
async selectScenario()                // Validate selected scenario
async createMissingVariables()        // Create new parameters
async showPreview()                   // Show preview dialog
async applyScenario()                 // Apply changes to model
```

**File Reading**:
```typescript
async readCsvFile(filePath: string): Promise<string> {
  const fs = (window as any).require('fs');
  return fs.readFileSync(filePath, 'utf-8');
}
```

**Template Structure**:
```html
<div class="scenario-loader">
  <h2>Load Scenario</h2>

  <!-- Step 1: File Selection -->
  <div *ngIf="!csvFilePath">
    <button mat-raised-button (click)="selectFile()">
      Browse CSV File...
    </button>
  </div>

  <!-- Step 2: Scenario Selection -->
  <div *ngIf="csvFilePath && scenarioData">
    <mat-form-field>
      <mat-label>Select Scenario</mat-label>
      <mat-select formControlName="scenarioName">
        <mat-option *ngFor="let scenario of scenarioData.scenarios"
                    [value]="scenario.name">
          {{ scenario.name }}
        </mat-option>
      </mat-select>
    </mat-form-field>
    <button mat-raised-button (click)="selectScenario()">
      Load Scenario
    </button>
  </div>
</div>
```

### 9. Update Module Exports (5 min)

**File**: `gui-js/libs/mods/mod-scenario-loader/src/index.ts`

```typescript
export * from './lib/scenario-loader.service';
export * from './lib/scenario-loader.component';
export * from './lib/dialogs/missing-variables-dialog.component';
export * from './lib/dialogs/preview-dialog.component';
export * from './lib/models/scenario-data.model';
```

## Base Code Changes (Minimal)

### Change 1: Add TypeScript Path Mapping

**File**: `gui-js/tsconfig.base.json`

**Location**: In `compilerOptions.paths` object

**Add**:
```json
"@minsky/mod-scenario-loader": ["libs/mods/mod-scenario-loader/src/index.ts"]
```

### Change 2: Add Route

**File**: `gui-js/libs/menu/src/lib/simulation/simulation-routing.module.ts`

**Add import**:
```typescript
import { ScenarioLoaderComponent } from '@minsky/mod-scenario-loader';
```

**Add route**:
```typescript
const routes: Routes = [
  { path: 'simulation-parameters', component: SimulationParametersComponent },
  { path: 'load-scenario', component: ScenarioLoaderComponent },  // ADD THIS
];
```

### Change 3: Import Component in Module

**File**: `gui-js/libs/menu/src/lib/simulation/simulation.module.ts`

**Add import**:
```typescript
import { ScenarioLoaderComponent } from '@minsky/mod-scenario-loader';
```

**Add to imports array**:
```typescript
@NgModule({
  imports: [
    CommonModule,
    SimulationRoutingModule,
    SimulationParametersComponent,
    ScenarioLoaderComponent  // ADD THIS
  ],
})
```

### Change 4: Add Menu Item

**File**: `gui-js/apps/minsky-electron/src/app/managers/ApplicationMenuManager.ts`

**Location**: Inside `getSimulationMenu()` method, after line 661

**Add**:
```typescript
{
  label: 'Load Scenario...',
  click() {
    WindowManager.createPopupWindowWithRouting({
      width: 600,
      height: 500,
      title: 'Load Scenario',
      url: `#/headless/menu/simulation/load-scenario`,
    });
  },
},
```

## CSV Format Example

```csv
Parameter,Units,Description,Conservative,Optimistic,Ideal
InnovationRateMicro,1/yr,Bass innovation coefficient,0.02,0.04,0.06
ImitationRateMicro,1/yr,Bass imitation coefficient,0.025,0.05,0.1
ChurnRate,1/yr,Annual issuer departure rate,0.6,0.5,0.4
MarketClearingRate,1/yr,Bond matching efficiency,0.5,0.75,0.9
```

**Column Order**:
| Position | Column | Required | Description |
|----------|--------|----------|-------------|
| 1 | Parameter | Yes | Variable name (without `:` prefix) |
| 2 | Units | No | Unit string (applied when creating variables) |
| 3 | Description | No | Tooltip text (applied when creating variables) |
| 4+ | Scenario1..N | Yes | Numeric values for each scenario |

**Notes**:
- Any number of scenarios supported
- Empty cells are skipped
- Invalid numeric values are skipped with warning
- Units and Description are optional columns - parser auto-detects their presence

## Error Handling

1. **Empty CSV**: Show error "CSV file is empty"
2. **No header**: Show error "CSV must have header row"
3. **Single column**: Show error "CSV must have at least one scenario column"
4. **All variables missing**: Show missing variables dialog, ask to create all
5. **No variables matched**: Show error, don't proceed
6. **Invalid numeric values**: Skip in preview, show warning

## Testing Checklist

- [ ] File selection dialog opens correctly
- [ ] CSV parses and populates scenario dropdown
- [ ] Variable matching finds global (`:` prefix) variables
- [ ] Missing variables dialog appears when needed
- [ ] Creating missing variables works
- [ ] Preview shows correct old → new values
- [ ] Apply updates model variables
- [ ] Cancel at any step closes cleanly
- [ ] Edge cases: empty CSV, all missing variables, invalid values

## Critical Files Reference

**Variable Access Pattern**:
```typescript
// Get all variables
const vars = await this.electronService.minsky.variableValues.summarise();

// Set variable value
await this.electronService.minsky.variableValues.elem(valueId).init(newValue);

// Create new variable
await this.electronService.minsky.canvas.addVariable(`:${name}`, 'parameter');
```

**File Dialog Pattern**:
```typescript
const filePath = await this.electronService.openFileDialog({
  defaultPath: ':data',
  filters: [{ extensions: ['csv'], name: 'CSV Files' }],
  properties: ['openFile']
});
```

**Dialog Pattern**:
```typescript
const dialogRef = this.dialog.open(ComponentClass, {
  width: '500px',
  data: { ... }
});

const result = await dialogRef.afterClosed().toPromise();
```

## Implementation Time Estimate

- Scaffold & models: 15 min
- CSV parser utility: 30 min
- Variable matcher utility: 30 min
- Service layer: 30 min
- Missing variables dialog: 20 min
- Preview dialog: 30 min
- Main component: 1 hour
- Base code changes: 15 min
- Testing & polish: 30 min

**Total**: ~4 hours

## Next Steps After Implementation

1. Create example CSV file for testing
2. Test with actual Minsky model
3. Document in mod README
4. Update BASE_CHANGES.md with all base code modifications
5. Create git branch: `git checkout -b mod/scenario-loader`
6. Commit and push to dev branch
