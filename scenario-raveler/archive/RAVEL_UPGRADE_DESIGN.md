# Scenario-Raveler: Ravel Upgrade Design

## Executive Summary

This document outlines a hybrid approach to upgrading scenario-raveler from a custom tensor-based architecture to leverage native Ravel features while retaining proven patterns.

## Current Architecture Analysis

### What We Have Now

**1. Data Structure**
- **ScenarioTensor**: 1D flattened array representing a 2D matrix [params × scenarios]
  - Row-major ordering: [p0_s0, p0_s1, ..., p1_s0, p1_s1, ...]
  - Created manually from CSV data
  - Stored as a parameter variable

**2. Control Mechanism**
- **SelectedScenario**: Parameter variable (0-based scenario index)
- **ScenarioOffset**: Constant to skip metadata columns
- **idx_ParamName**: One constant per parameter (parameter index in tensor)

**3. Extraction Logic**
- Two-level Gather operations:
  1. Gather by parameter index (idx_*) on "name" axis
  2. Gather by (SelectedScenario + ScenarioOffset) on "attribute" axis
- Complex wiring network connecting tensor → gather1 → gather2 → output variable

**4. Workflow**
- CSV parsing with validation and rich metadata
- UI for file selection and preview
- Infrastructure generation creates all variables, constants, and wiring

### Strengths to Preserve

✅ **CSV Parser** - Robust validation, metadata extraction, type detection
✅ **UI Workflow** - Clean file selection → preview → generate flow
✅ **Separation Logic** - Distinguishes scenario-dependent vs independent parameters
✅ **Metadata Handling** - Preserves type, units, description, tooltips
✅ **Angular Components** - Well-structured component architecture

### Pain Points to Address

❌ **Manual Tensor Flattening** - Loses dimensionality, requires index arithmetic
❌ **idx_* Constants** - Creates N+2 extra variables (N params + SelectedScenario + ScenarioOffset)
❌ **Complex Gather Chains** - Two-level gather operations per parameter
❌ **Index Arithmetic** - ScenarioOffset calculation for metadata columns
❌ **No Visual Data Representation** - Tensor is opaque, can't see structure

---

## Ravel Capabilities Review

From the Ravel tutorial, key features relevant to our use case:

### 1. Ravel Widget (Multi-dimensional Data Object)
- Native n-dimensional data structure with named axes
- Each axis has labels (not just numeric indices)
- Visual representation of data structure
- Built-in axis operations: rotate, slice, rollup

### 2. Locks (Data Slice Capture)
- Capture a specific slice of a Ravel at current state
- Can lock on specific axis values or ranges
- Output is a lower-dimensional tensor
- Perfect for "freeze current scenario, extract parameter values"

### 3. Calipers (Range Selection)
- Select contiguous ranges on an axis
- Visual slider/selection UI
- Can be used to choose scenario(s) dynamically

### 4. Axis Labels
- String labels for dimension values (not just 0, 1, 2...)
- Eliminates need for separate index constants
- Human-readable ("Scenario_1", "Scenario_2" vs 0, 1, 2)

### 5. Gather Operation (Native)
- Ravel has built-in gather operations
- Works with axis labels directly
- Can gather by index or by label

---

## Hybrid Approach Design

### Philosophy
**"Use Ravel for what Ravel does best, keep custom logic where it adds value"**

### Architecture Comparison

| Component | Current | Proposed Ravel Approach |
|-----------|---------|-------------------------|
| **Data Structure** | 1D flattened array | 2D Ravel widget [params × scenarios] |
| **Axis Labels** | idx_* constants | Native Ravel axis labels |
| **Scenario Selection** | SelectedScenario + ScenarioOffset | Caliper on scenario axis |
| **Parameter Extraction** | 2-level Gather chains | Single Lock per parameter |
| **CSV Parsing** | Custom CsvParser | **Keep** CsvParser (adds validation) |
| **UI Workflow** | Angular components | **Keep** (file → preview → generate) |
| **Metadata** | Stored in tooltips | **Keep** (Ravel doesn't handle this) |

### Detailed Design

#### 1. Data Import: CSV → Ravel

**Current Flow:**
```typescript
CSV → CsvParser.parse() → ScenarioData
  → flattenTensor() → 1D array
  → createTensor('ScenarioTensor', flatArray)
```

**Proposed Flow:**
```typescript
CSV → CsvParser.parse() → ScenarioData
  → build2DMatrix() → 2D array [params × scenarios]
  → createRavelWidget('ScenarioRavel', 2DArray, paramLabels, scenarioLabels)
```

**Implementation:**
```typescript
private async createRavelWidget(
  name: string,
  data: number[][], // 2D array [params × scenarios]
  paramLabels: string[], // ["Param1", "Param2", ...]
  scenarioLabels: string[] // ["Scenario_1", "Scenario_2", ...]
): Promise<void> {
  // 1. Create Ravel widget via Minsky API
  await this.electron.minsky.canvas.addRavelWidget(name);

  // 2. Get Ravel object reference
  const ravel = new RavelBase(this.electron.minsky.canvas.itemFocus);

  // 3. Set up axes
  await ravel.setAxisLabels(0, paramLabels); // Axis 0: Parameters
  await ravel.setAxisLabels(1, scenarioLabels); // Axis 1: Scenarios

  // 4. Import data (may use importData() or setData() API)
  await ravel.setData(data.flat()); // Flattened, but Ravel knows structure
}
```

#### 2. Scenario Selection: Caliper

**Current:**
- SelectedScenario parameter (0-based index)
- ScenarioOffset constant
- Arithmetic: `adjustedIndex = SelectedScenario + ScenarioOffset`

**Proposed:**
- Caliper on Ravel's scenario axis (Axis 1)
- User moves caliper to select scenario visually
- No offset arithmetic needed

**Implementation:**
```typescript
private async createScenarioCaliper(ravelName: string): Promise<void> {
  // Get Ravel reference
  const ravel = await this.findRavelByName(ravelName);

  // Create caliper on scenario axis (Axis 1)
  await ravel.addCaliper(1); // 1 = scenario axis

  // Set initial position to first scenario
  await ravel.setCaliperPosition(1, 0);
}
```

#### 3. Parameter Extraction: Locks

**Current:**
- For each parameter:
  - Create idx_ParamName constant
  - Create Gather operation (name axis)
  - Create Gather operation (attribute axis)
  - Wire: Tensor → Gather1 → Gather2 → ParamVariable

**Proposed:**
- For each parameter:
  - Create Lock on Ravel (locked to parameter's label on axis 0)
  - Wire: Lock → ParamVariable

**Implementation:**
```typescript
private async createParameterLock(
  ravelName: string,
  paramName: string,
  paramLabel: string,
  x: number,
  y: number
): Promise<void> {
  // 1. Get Ravel reference
  const ravel = await this.findRavelByName(ravelName);

  // 2. Create Lock
  const lock = await ravel.createLock();

  // 3. Configure Lock to select this parameter
  // Lock axis 0 (parameter axis) to this parameter's label
  await lock.setAxisSelection(0, paramLabel);

  // 4. Axis 1 (scenario axis) is NOT locked - follows Caliper
  // Result: Lock outputs a 1D vector of scenario values for this parameter

  // 5. Create output variable
  await this.createVariable(paramName, 'flow', '0', x, y);

  // 6. Wire Lock output → Variable input
  // (Wiring details depend on Minsky Lock API)
}
```

**Benefits:**
- 1 Lock per parameter instead of 2 Gathers + 1 constant
- Lock automatically follows Caliper position
- Cleaner wiring topology

#### 4. Static Parameters (No Scenarios)

**Current:** Create as regular variables with init values
**Proposed:** **Keep unchanged** - these don't need Ravel

---

## Implementation Plan

### Phase 1: Refactor Data Layer ✅ Already Done
- ✅ Rename all references from scenario-grower to scenario-raveler
- ✅ Update module names, file names, routes

### Phase 2: Ravel API Investigation 🔍 Next Step
**Goal:** Understand Minsky's Ravel API capabilities

**Research Questions:**
1. How to create a Ravel widget programmatically?
   - `minsky.canvas.addRavelWidget(name)?`
   - `minsky.canvas.addOperation('ravel')?`
2. How to set data in a Ravel?
   - `ravel.setData(array)?`
   - `ravel.importData(data, axes)?`
3. How to set axis labels?
   - `ravel.setAxisLabels(axisIndex, labels)?`
4. How to create Locks?
   - `ravel.createLock()?`
   - Separate Lock widget?
5. How to configure Lock selections?
   - `lock.setAxisSelection(axis, value)?`
6. How to create Calipers?
   - `ravel.addCaliper(axisIndex)?`
7. How to wire Lock outputs?
   - Port structure of Lock widgets?

**Action Items:**
- [ ] Search codebase for Ravel API examples
- [ ] Check Minsky TypeScript definitions (@minsky/shared)
- [ ] Review test files for Ravel usage patterns
- [ ] Test simple Ravel creation in dev environment

### Phase 3: Update ScenarioTensorBuilderService
**Goal:** Replace flattened tensor with 2D Ravel

**Changes:**
```typescript
// OLD: src/lib/scenario-tensor-builder.service.ts
private flattenTensor() { ... }
await this.createTensor('ScenarioTensor', flatArray);

// NEW:
private build2DMatrix() {
  // Returns number[][] instead of number[]
}
await this.createRavelWidget(
  'ScenarioRavel',
  matrix2D,
  paramNames,
  scenarioNames
);
await this.createScenarioCaliper('ScenarioRavel');
await this.createParameterLocks(
  'ScenarioRavel',
  parameters,
  layout
);
```

### Phase 4: Update ScenarioWiringService
**Goal:** Update manual wiring flow to use Ravel

**Current Flow:**
1. User enters tensor name
2. Service reads tensor structure via hypercube JSON
3. Creates idx_* constants and Gather networks

**New Flow:**
1. User enters Ravel name
2. Service reads Ravel structure via Ravel API
3. Creates Locks instead of Gathers

### Phase 5: Simplify ScenarioMkyGeneratorService
**Goal:** Generate Lock-based XML instead of Gather chains

**Changes:**
- Remove `createGatherItem()` for two-level gathers
- Add `createLockItem()` for Ravel Locks
- Remove ScenarioOffset calculation
- Simplify wiring topology

### Phase 6: Update UI (Optional Enhancements)
**Goal:** Reflect Ravel terminology in UI

**Changes:**
- "Ravel Scenario Infrastructure" (already done ✅)
- Preview could show "Will create Ravel widget with N×M dimensions"
- Success message: "Ravel created with N parameters × M scenarios"

### Phase 7: Testing & Validation
**Test Cases:**
1. Import CSV with 5 params × 3 scenarios
2. Verify Ravel widget created with correct dimensions
3. Verify Caliper allows scenario selection
4. Verify Locks output correct parameter values
5. Test with scenario-independent parameters
6. Test with mixed scenario-dependent and independent

---

## Migration Path

### For Existing Users

**Breaking Change:** Models using old "ScenarioTensor" won't work with new "ScenarioRavel"

**Migration Options:**
1. **Automatic conversion** (complex):
   - Detect old ScenarioTensor variable
   - Convert to new Ravel structure
   - Update wiring
2. **Manual re-import** (simple):
   - User re-imports CSV with new version
   - Old infrastructure remains (won't conflict)
   - User can delete old structure manually

**Recommendation:** Manual re-import (simpler, cleaner)

### Version Bump
- Current: v2.0.0
- After Ravel upgrade: v3.0.0 (major breaking change)

---

## Open Questions

### Technical
1. ❓ Does Minsky have a TypeScript API for Ravel widgets?
2. ❓ Can we programmatically create Locks, or are they manual UI operations?
3. ❓ How do Locks interact with Calipers? (auto-follow or explicit wiring?)
4. ❓ Can we import data into Ravel via API, or only via CSV import?
5. ❓ What's the port structure of Lock widgets for wiring?

### Design
6. ❓ Should we support both old (tensor) and new (Ravel) modes?
7. ❓ Should Caliper be automatically created, or let user create it?
8. ❓ Should parameter Locks be inside a Group, or loose on canvas?

### UX
9. ❓ How to handle scenario names with special characters in axis labels?
10. ❓ Should we expose Ravel visualization in the mod UI, or keep it canvas-only?

---

## Success Criteria

### Functional
- ✅ CSV import creates 2D Ravel instead of 1D tensor
- ✅ Caliper allows scenario selection
- ✅ Locks extract correct parameter values for selected scenario
- ✅ Scenario-independent parameters still work as before
- ✅ Units, descriptions, types preserved

### Quality
- ✅ Fewer variables created (no idx_* constants)
- ✅ Simpler wiring topology (1 Lock vs 2 Gathers + 1 constant per param)
- ✅ More intuitive for users familiar with Ravel
- ✅ Visual data representation (Ravel widget shows structure)

### Code
- ✅ Cleaner ScenarioTensorBuilderService (no flattening logic)
- ✅ Simpler ScenarioMkyGeneratorService (no offset arithmetic)
- ✅ Maintainable: uses Ravel's native features instead of reimplementing

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Rename | ✅ Done | - |
| Phase 2: API Research | 2-4 hours | Access to Minsky codebase |
| Phase 3: TensorBuilder | 4-6 hours | Phase 2 complete |
| Phase 4: WiringService | 3-4 hours | Phase 3 complete |
| Phase 5: MkyGenerator | 3-4 hours | Phase 3 complete |
| Phase 6: UI Updates | 1-2 hours | Optional |
| Phase 7: Testing | 3-4 hours | Phases 3-5 complete |
| **Total** | **16-24 hours** | - |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ravel API doesn't support programmatic creation | High | Fallback to XML generation + import |
| Lock behavior differs from expected | Medium | Use Gather fallback, investigate Lock semantics |
| Performance issues with large Ravel widgets | Low | Profile with test data, optimize if needed |
| Breaking change disrupts users | Medium | Clear migration docs, version bump to 3.0.0 |

---

## Conclusion

The hybrid approach balances innovation with pragmatism:
- **Leverage Ravel** where it excels (multi-dimensional data, axis labels, slicing)
- **Keep proven patterns** where they add value (CSV parsing, UI workflow, metadata)
- **Simplify architecture** by removing custom tensor flattening and index arithmetic
- **Improve UX** with visual Ravel representation and Caliper-based selection

**Next Step:** Phase 2 API Research to understand Minsky's Ravel programmatic capabilities.
