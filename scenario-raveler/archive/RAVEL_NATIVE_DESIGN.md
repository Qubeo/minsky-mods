# Scenario-Raveler: Native Ravel Design (Updated)

## Executive Summary

Based on analysis of working Ravel XML examples and the official Ravel tutorial, this document outlines a **dramatically simplified** approach that leverages Minsky's native CSV import and Ravel/Lock infrastructure.

**Key Insight:** We don't need custom CSV parsing or tensor building. Minsky's native CSV import creates Ravel variables, and Lock widgets extract parameter values. Our mod just needs to configure the Locks and create wiring.

---

## Architecture: Native Ravel Approach

### Data Flow

```
User imports CSV via native Minsky
         ↓
   Ravel Variable (multi-dimensional data)
         ↓
   Lock Widget (one per parameter)
    - Slices Ravel to parameter dimensions
    - Outputs parameter time series
         ↓
   Flow Variable (model parameter)
```

### Example from Working XML

From the provided XML example (BIS debt data):

```xml
<!-- Ravel with multi-dimensional data -->
<Item id="0" type="Ravel">
  <ravelState>
    <handleStates>
      <!-- Axes: Country, Gender, Year, Unit, Sector, etc. -->
    </handleStates>
  </ravelState>
</Item>

<!-- Lock extracting specific slice -->
<Item id="12" type="Lock">
  <ravelState>
    <outputHandles>
      <string>Date</string>
      <string>Country</string>
    </outputHandles>
    <handleStates>
      <!-- Sector: sliced to "Private non-financial sector" -->
      <!-- Unit: sliced to "Percentage of GDP" -->
    </handleStates>
  </ravelState>
</Item>

<!-- Wiring: Ravel → Lock → Variable -->
<Wire><from>1</from><to>14</to></Wire>  <!-- Ravel port 1 → Lock port 14 -->
<Wire><from>13</from><to>11</to></Wire> <!-- Lock port 13 → Variable port 11 -->

<!-- Output variable -->
<Item id="9" type="Variable:flow">
  <name>:Debt_{Priv}^{\%GDP}</name>
</Item>
```

**Key Observations:**
- Lock has `outputHandles` (dimensions that remain: Date, Country)
- Lock has `handleStates` where some axes are sliced to specific values
- Wiring is simple: Ravel → Lock → Variable

---

## What We DON'T Need Anymore

### ❌ Remove Entire Components

1. **CSV Parser** (`src/lib/utils/csv-parser.util.ts`)
   - ❌ No custom parsing needed
   - ✅ Use Minsky's native CSV import

2. **ScenarioTensorBuilderService** (`src/lib/scenario-tensor-builder.service.ts`)
   - ❌ No tensor flattening
   - ❌ No idx_* constants
   - ❌ No ScenarioTensor/SelectedScenario variables
   - ✅ Just configure Lock widgets

3. **ScenarioMkyGeneratorService** (`src/lib/scenario-mky-generator.service.ts`)
   - ❌ No two-level Gather chains
   - ❌ No ScenarioOffset arithmetic
   - ✅ Simple Lock-based XML generation

4. **Custom CSV Import UI** (parts of `src/lib/scenario-raveler.component.ts`)
   - ❌ No file selection dialog
   - ❌ No CSV preview table
   - ✅ User imports via native Minsky UI first

---

## What We DO Need

### ✅ New Simplified Components

#### 1. Lock Configuration Service

```typescript
class ScenarioLockConfigService {
  /**
   * Configures Lock widgets for a given Ravel variable
   * @param ravelName - Name of Ravel variable (e.g., "ScenarioData")
   * @param parameters - List of parameters to extract
   * @param scenarioDimension - Which axis represents scenarios (e.g., "Scenario")
   */
  async configureLocks(
    ravelName: string,
    parameters: ParameterConfig[],
    scenarioDimension: string
  ): Promise<void>
}

interface ParameterConfig {
  name: string;           // e.g., "InterestRate"
  outputDimensions: string[];  // e.g., ["Time", "Scenario"]
  slicedDimensions: {     // Fixed values for other dimensions
    [axis: string]: string;  // e.g., {"Unit": "Percent", "Type": "Real"}
  };
}
```

**What it does:**
- For each parameter, creates a Lock widget
- Configures Lock's `ravelState`:
  - `outputHandles`: Dimensions that remain (Time, Scenario, etc.)
  - `handleStates`: Which axes to slice and to what values
- Wires Lock output → Flow variable

#### 2. Lock XML Generator

```typescript
class LockXmlGeneratorService {
  /**
   * Generates XML for Lock widgets
   */
  generateLockItem(
    lockId: number,
    x: number,
    y: number,
    outputHandles: string[],
    handleStates: HandleState[]
  ): string {
    return `<Item>
  <id>${lockId}</id>
  <type>Lock</type>
  <x>${x}</x>
  <y>${y}</y>
  <ports><int>${portIn}</int><int>${portOut}</int></ports>
  <ravelState>
    <outputHandles>
      ${outputHandles.map(h => `<string>${h}</string>`).join('\n')}
    </outputHandles>
    <handleStates>
      ${handleStates.map(hs => this.generateHandleState(hs)).join('\n')}
    </handleStates>
  </ravelState>
</Item>`;
  }
}
```

#### 3. LockGroup Creator (Optional but Recommended)

```typescript
class LockGroupService {
  /**
   * Creates a LockGroup to synchronize scenario/time selection
   * across all parameter Locks
   */
  async createLockGroup(ravelIds: number[]): Promise<void> {
    const lockGroup = {
      ravels: ravelIds,
      handleLockInfo: [
        {
          slicer: true,
          orientation: true,
          calipers: true,
          order: true,
          handleNames: ravelIds.map(() => "Scenario")
        },
        {
          slicer: true,
          orientation: true,
          calipers: true,
          order: true,
          handleNames: ravelIds.map(() => "Time")
        }
      ]
    };

    // Apply lockGroup to model
    await this.electron.minsky.lockGroups.add(lockGroup);
  }
}
```

**Why LockGroup matters:**
- When user changes scenario on one Lock, ALL Locks update
- Provides visual Caliper for scenario selection
- Synchronizes Time axis across all parameters

---

## New User Workflow

### Step 1: Import CSV (Native Minsky)

```
User Actions:
1. File → Import Data (native Minsky)
2. Select CSV file with scenario data
3. Configure dimensions:
   - Horizontal dimension: Scenarios (or Time)
   - Vertical dimensions: Parameters
4. Import → Creates Ravel variable (e.g., "ScenarioData")
```

**CSV Format Example:**
```csv
Parameter,Unit,Scenario_1,Scenario_2,Scenario_3
InterestRate,%,2.5,3.0,3.5
GrowthRate,%,2.0,2.5,3.0
Inflation,%,1.5,2.0,2.5
```

**Result:** Minsky creates a Ravel variable with dimensions [Parameter, Scenario]

### Step 2: Configure Scenario Locks (Our Mod)

```
User Actions:
1. Simulation → Ravel Scenario Parameters
2. Enter name of Ravel variable: "ScenarioData"
3. Select which parameters to wire
4. Click "Create Locks"
```

**What Our Mod Does:**
```typescript
async createScenarioLocks(ravelName: string, selectedParams: string[]): Promise<void> {
  const ravel = await this.findRavel(ravelName);
  const axes = await ravel.getAxes(); // ["Parameter", "Scenario"]

  for (const paramName of selectedParams) {
    // Create Lock for this parameter
    const lock = await this.createLock(ravelName, paramName, {
      outputHandles: ["Scenario"],  // Keep Scenario dimension
      slicedDimensions: {
        "Parameter": paramName      // Slice to this specific parameter
      }
    });

    // Create output variable
    await this.createVariable(paramName, 'flow', x, y);

    // Wire Lock → Variable
    await this.wirePort(lock.outputPort, variable.inputPort);
  }

  // Create LockGroup to synchronize scenario selection
  await this.createLockGroup(locks.map(l => l.id));
}
```

**Result:**
- One Lock per parameter
- All Locks grouped (scenario selection synchronized)
- Flow variables wired and ready

### Step 3: Use Parameters in Model

User can now:
- Use flow variables (InterestRate, GrowthRate, etc.) in model equations
- Change scenario via Caliper on any Lock (all sync via LockGroup)
- Visualize parameter values over scenarios in Plots

---

## Implementation Details

### Lock Configuration Structure

From the XML example, each Lock needs:

```typescript
interface LockConfig {
  id: number;
  type: "Lock";
  x: number;
  y: number;
  ports: [number, number];  // [input from Ravel, output to Variable]

  ravelState: {
    radius: number;  // Display radius (e.g., 100)
    outputHandles: string[];  // Dimensions that remain (e.g., ["Date", "Country"])

    handleStates: {
      [axisName: string]: {
        description: string;     // Axis description
        x: number;              // Position on Ravel circle
        y: number;
        collapsed: boolean;      // true = sliced/reduced, false = output
        displayFilterCaliper: boolean;
        reductionOp: "sum" | "max" | "min" | "avg";  // If collapsed
        order: "none" | "forward" | "staticForward";
        minLabel: string;       // First value on axis
        maxLabel: string;       // Last value (or empty if sliced)
        sliceLabel: string;     // Specific value if sliced (e.g., "Australia")
      };
    };
  };
}
```

### Positioning Locks on Canvas

```typescript
const layout = {
  ravelX: 100,
  ravelY: 300,
  lockStartX: 400,
  lockStartY: 100,
  lockSpacingY: 100,
  variableOffsetX: 200
};

for (let i = 0; i < parameters.length; i++) {
  const lockY = layout.lockStartY + (i * layout.lockSpacingY);
  const lock = await this.createLock(ravelName, parameters[i], lockY);
  const variable = await this.createVariable(
    parameters[i],
    layout.lockStartX + layout.variableOffsetX,
    lockY
  );
  await this.wire(lock, variable);
}
```

### HandleState Examples

**Sliced Axis** (fixed to specific value):
```typescript
{
  "Parameter": {
    description: "Parameter",
    x: -100,
    y: 0,
    collapsed: false,  // Not aggregated, just sliced
    reductionOp: "sum",
    minLabel: "InterestRate",
    maxLabel: "",  // Empty because sliced
    sliceLabel: "InterestRate"  // Fixed to this value
  }
}
```

**Output Axis** (remains as dimension):
```typescript
{
  "Scenario": {
    description: "Scenario",
    x: 100,
    y: 0,
    collapsed: false,
    reductionOp: "sum",
    minLabel: "Scenario_1",
    maxLabel: "Scenario_3",
    sliceLabel: ""  // Empty = not sliced, output all values
  }
}
```

---

## Comparison: Old vs New

| Aspect | Old (Custom Tensor) | New (Native Ravel) |
|--------|---------------------|-------------------|
| **CSV Import** | Custom parser, validation | Native Minsky import |
| **Data Structure** | Flattened 1D array | Native multi-dimensional Ravel |
| **Scenario Selection** | SelectedScenario + ScenarioOffset | Caliper on Lock (visual) |
| **Parameter Indexing** | idx_* constants (N variables) | Lock slicing (no extra variables) |
| **Extraction** | 2-level Gather chains | Single Lock widget |
| **Synchronization** | Manual arithmetic | LockGroup (automatic) |
| **Variables Created** | N params + N idx + 2 control = 2N+2 | N params only |
| **Wiring Complexity** | High (Gather chains) | Low (Ravel → Lock → Var) |
| **User Visibility** | Opaque tensor data | Visual Ravel with axes |

---

## Updated File Changes

### Files to Delete/Gut
- `src/lib/utils/csv-parser.util.ts` - No longer needed
- `src/lib/scenario-tensor-builder.service.ts` - Replace entirely
- `src/lib/scenario-mky-generator.service.ts` - Simplify drastically

### Files to Modify
- `src/lib/scenario-raveler.component.ts` - New UI workflow
- `src/lib/scenario-wiring.service.ts` - Adapt for Locks instead of Gathers

### New Files to Create
- `src/lib/lock-config.service.ts` - Lock widget configuration
- `src/lib/lock-xml-generator.service.ts` - XML generation for Locks
- `src/lib/lockgroup.service.ts` - LockGroup management

---

## New UI Design

### Simplified Component

```typescript
@Component({
  selector: 'minsky-scenario-raveler',
  template: `
    <div class="scenario-raveler">
      <h2>Ravel Scenario Parameters</h2>

      <!-- Step 1: Point to Ravel -->
      <div class="step">
        <h3>1. Select Ravel Variable</h3>
        <p>First, import your scenario CSV via File → Import Data</p>
        <p>Then, enter the name of the created Ravel variable:</p>
        <input [(ngModel)]="ravelName" placeholder="e.g., ScenarioData">
        <button (click)="detectParameters()">Detect Parameters</button>
      </div>

      <!-- Step 2: Select Parameters -->
      <div class="step" *ngIf="detectedParameters.length">
        <h3>2. Select Parameters to Wire</h3>
        <div *ngFor="let param of detectedParameters">
          <label>
            <input type="checkbox" [(ngModel)]="param.selected">
            {{ param.name }}
          </label>
        </div>
      </div>

      <!-- Step 3: Configure Axes -->
      <div class="step" *ngIf="detectedParameters.length">
        <h3>3. Configure Dimensions</h3>
        <label>Scenario Axis:
          <select [(ngModel)]="scenarioAxis">
            <option *ngFor="let axis of availableAxes">{{axis}}</option>
          </select>
        </label>
      </div>

      <!-- Step 4: Create -->
      <div class="step">
        <button (click)="createLocks()" [disabled]="!canCreate()">
          Create Scenario Locks
        </button>
      </div>
    </div>
  `
})
export class ScenarioRavelerComponent {
  ravelName: string = '';
  detectedParameters: Parameter[] = [];
  availableAxes: string[] = [];
  scenarioAxis: string = '';

  async detectParameters(): Promise<void> {
    // Query Ravel via Minsky API to get axes and values
    const ravel = await this.findRavel(this.ravelName);
    this.availableAxes = await ravel.getAxes();

    // Detect which axis has parameter names
    for (const axis of this.availableAxes) {
      const values = await ravel.getAxisValues(axis);
      // Heuristic: Parameter axis likely has names, not numbers
      if (values.some(v => isNaN(parseFloat(v)))) {
        this.detectedParameters = values.map(name => ({
          name,
          selected: true
        }));
        break;
      }
    }
  }

  async createLocks(): Promise<void> {
    const selected = this.detectedParameters.filter(p => p.selected);
    await this.lockConfigService.configureLocks(
      this.ravelName,
      selected.map(p => ({
        name: p.name,
        outputDimensions: [this.scenarioAxis],
        slicedDimensions: { "Parameter": p.name }
      })),
      this.scenarioAxis
    );

    this.success = `✓ Created ${selected.length} parameter locks`;
  }
}
```

---

## Migration Path

### For Users of Old scenario-grower

**Breaking Change:** Complete reimplementation

**Migration Steps:**
1. Export scenario data from old infrastructure to CSV
2. Import CSV via native Minsky (creates Ravel)
3. Use new scenario-raveler mod to create Locks
4. Delete old ScenarioTensor infrastructure

---

## Advantages of Native Approach

### 1. **Simplicity**
- No custom CSV parsing (dozens of edge cases)
- No tensor flattening logic (error-prone)
- No index arithmetic (ScenarioOffset complexity)

### 2. **Visual Feedback**
- Users see Ravel widget with all dimensions
- Calipers provide visual scenario selection
- Locks show what data they're extracting

### 3. **Flexibility**
- Works with any Ravel structure (not just Parameter×Scenario)
- Can have Time dimension, Country dimension, etc.
- Lock configuration adapts to data shape

### 4. **Maintainability**
- Leverages Minsky's tested CSV import
- Uses standard Ravel/Lock infrastructure
- Fewer lines of custom code

### 5. **Performance**
- No data duplication (Ravel is source of truth)
- No large flattened arrays
- Native C++ Ravel operations

---

## Next Steps

### Phase 1: Prototype
- [ ] Create `LockConfigService` basic implementation
- [ ] Test Lock creation via Minsky API
- [ ] Verify wiring: Ravel → Lock → Variable

### Phase 2: XML Generation
- [ ] Implement `LockXmlGeneratorService`
- [ ] Generate Lock XML matching working example structure
- [ ] Test XML import into Minsky

### Phase 3: LockGroup Support
- [ ] Implement `LockGroupService`
- [ ] Test synchronization across multiple Locks
- [ ] Verify Caliper functionality

### Phase 4: UI Integration
- [ ] Update ScenarioRavelerComponent to new workflow
- [ ] Add Ravel detection/validation
- [ ] Add parameter selection UI

### Phase 5: Testing & Documentation
- [ ] Test with various CSV structures
- [ ] Create example files
- [ ] Update README and tutorials

---

## Open Questions

1. ✅ **Resolved:** Use native CSV import instead of custom parser
2. ✅ **Resolved:** Use Lock widgets instead of Gather chains
3. ✅ **Resolved:** Use LockGroup for synchronization
4. ❓ **Minsky API:** What's the exact API for:
   - Creating Lock widgets programmatically?
   - Configuring Lock ravelState?
   - Creating LockGroups?
5. ❓ **Handle Positions:** How to calculate x,y positions for handles on Ravel circle?

---

## Conclusion

The native Ravel approach is **dramatically simpler** than the custom tensor approach:

**Before (Custom):**
- Custom CSV parser (500+ lines)
- Tensor flattening logic (200+ lines)
- Two-level Gather network generation (300+ lines)
- **Total: ~1000+ lines of complex logic**

**After (Native):**
- Lock configuration (100 lines)
- XML generation for Locks (150 lines)
- UI for Ravel selection (100 lines)
- **Total: ~350 lines of straightforward logic**

**Result: 65% less code, 90% simpler logic, 100% more maintainable.**
