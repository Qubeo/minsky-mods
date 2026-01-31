# Scenario Loader Architecture v2.0

## Overview

This document describes the upgraded architecture for the scenario-loader mod, designed according to software engineering best practices: separation of concerns, single source of truth, semantic clarity, and maintainability.

## Architecture Principles

### 1. **Single Source of Truth (SST)**
- The CSV file is the authoritative source for all scenario data
- The `ScenarioTensor` variable stores this data in a structured, queryable format
- All parameter values are derived from the tensor, never duplicated

### 2. **Separation of Concerns**
- **Part 1: Initial Construction** - Builds the scenario infrastructure once
- **Part 2: Consistency Checking** - Validates and updates against SST

### 3. **Semantic Clarity**
- Named index constants (`idx_ParamName`) instead of magic numbers
- Clear variable naming conventions
- Encapsulated in a dedicated Group

### 4. **Maintainability**
- Self-documenting structure
- Easy to inspect and debug
- Minimal wire complexity (though some wires are necessary for gather operations)

## Architecture Design

### Part 1: Initial Construction

Creates a **Scenario Infrastructure Group** containing:

```
Scenario Infrastructure Group
├── ScenarioTensor (variable, type: parameter)
│   └── Shape: [num_parameters, num_scenarios]
│   └── X-vector[0]: Parameter names (dimension: "Parameter")
│   └── X-vector[1]: Scenario names (dimension: "Scenario")
│   └── Values: All scenario data from CSV
│
├── SelectedScenario (variable, type: parameter)
│   └── Controls which scenario column is active
│   └── Initial value: 0 (first scenario)
│
└── For each parameter (e.g., "InnovationRate"):
    ├── idx_InnovationRate (variable, type: constant)
    │   └── Value: Parameter's row index in ScenarioTensor
    │
    └── InnovationRate (variable, type: parameter)
        └── Initial value: gather(ScenarioTensor, idx_InnovationRate, SelectedScenario)
        └── Wired from gather operation output
```

#### Construction Flow

1. **Parse CSV** → Extract parameters, scenarios, values
2. **Create Group** → "Scenario Infrastructure" group
3. **Create ScenarioTensor**:
   - Create tensor variable with appropriate dimensions
   - Set x-vectors for parameter names and scenario names
   - Populate tensor values from CSV
4. **Create SelectedScenario**:
   - Parameter variable controlling active scenario
   - Initial value: 0 (first scenario index)
5. **For each parameter**:
   - Create `idx_ParamName` constant with parameter's row index
   - Create `ParamName` variable (if doesn't exist) or update existing
   - Create gather operation
   - Wire: ScenarioTensor → gather (port 1)
   - Wire: idx_ParamName → gather (port 2) 
   - Wire: SelectedScenario → gather (port 3, if gather supports 3 ports for 2D indexing)
   - Wire: gather → ParamName (port 1)

**Note on Gather Operations**: 
- Minsky's `gather` operation takes a tensor and an index
- For 2D tensors, we may need to use `slice` first, then `gather`, or use a different approach
- Alternative: Use `gather` with a computed index: `gather(ScenarioTensor, idx_ParamName * num_scenarios + SelectedScenario)`
- Or: Use two gather operations in sequence (gather by parameter, then by scenario)

#### Alternative: Initial Value Expressions

**Question**: Can we avoid wires by using initial value expressions?

**Answer**: Partially. Initial values can reference other variables, but:
- For parameters that need to be "live" (update when SelectedScenario changes), we need wires
- For parameters that are only read at initialization, we could use: `gather(ScenarioTensor, idx_ParamName, SelectedScenario)`
- However, this would require the expression parser to support `gather()` function calls

**Decision**: Use wires for now, as they provide:
- Clear visual representation
- Guaranteed correctness
- Works with current Minsky capabilities

### Part 2: Consistency Checking

Validates the current model state against the CSV (SST).

#### Consistency Checks

1. **ScenarioTensor exists** → Verify it matches CSV structure
2. **Parameter indices** → All parameters from CSV have corresponding `idx_ParamName` constants
3. **Parameter variables** → All parameters have corresponding variables
4. **Scenario values** → Compare tensor values with CSV values
5. **New parameters** → Detect parameters in CSV not in model
6. **New scenarios** → Detect scenarios in CSV not in tensor
7. **Removed parameters** → Detect parameters in model not in CSV (optional warning)

#### Update Operations

1. **Add new parameters**:
   - Extend ScenarioTensor (add new rows)
   - Create idx_ParamName constants
   - Create ParamName variables
   - Wire gather operations

2. **Add new scenarios**:
   - Extend ScenarioTensor (add new columns)
   - Update x-vector for scenarios

3. **Update values**:
   - Rebuild ScenarioTensor with new values
   - Preserve existing structure

4. **Remove parameters** (optional):
   - Warn user
   - Optionally remove from model

## Implementation Structure

### Services

1. **ScenarioTensorBuilder** (Part 1)
   - `buildScenarioInfrastructure(csvData: ScenarioData): Promise<void>`
   - `createScenarioTensor(...)`
   - `createParameterInfrastructure(...)`
   - `createGatherOperations(...)`

2. **ScenarioConsistencyChecker** (Part 2)
   - `checkConsistency(csvData: ScenarioData): Promise<ConsistencyReport>`
   - `updateFromCsv(csvData: ScenarioData): Promise<void>`

3. **ScenarioLoaderService** (Orchestration)
   - Coordinates between builder and checker
   - Handles user workflow

### Models

```typescript
interface ScenarioInfrastructure {
  groupId: string;
  scenarioTensorId: string;
  selectedScenarioId: string;
  parameterIndices: Map<string, string>; // paramName -> idx_ParamName variable id
  parameterVariables: Map<string, string>; // paramName -> variable id
}

interface ConsistencyReport {
  isConsistent: boolean;
  missingParameters: string[];
  newParameters: string[];
  newScenarios: string[];
  valueMismatches: Array<{param: string, scenario: string, expected: number, actual: number}>;
}
```

## User Workflow

### First-Time Setup (Construction)

1. User selects CSV file
2. System parses CSV
3. System creates Scenario Infrastructure Group
4. System creates all parameter infrastructure
5. User can now change scenarios via `SelectedScenario` variable

### Subsequent Updates (Consistency Check)

1. User selects CSV file (same or updated)
2. System checks consistency
3. If inconsistencies found:
   - Show report
   - Ask user to update
   - System updates infrastructure
4. If consistent:
   - Confirm "Model matches CSV"

## Benefits of This Architecture

1. **Single Source of Truth**: CSV is authoritative, tensor is the model representation
2. **Semantic Clarity**: Named indices make the model self-documenting
3. **Encapsulation**: All scenario logic in one group
4. **Maintainability**: Clear structure, easy to understand
5. **Extensibility**: Easy to add new parameters or scenarios
6. **Validation**: Consistency checker ensures model matches CSV
7. **User Control**: `SelectedScenario` variable allows runtime scenario switching

## Technical Considerations

### Gather Operation for 2D Tensor

For a 2D tensor `ScenarioTensor[param_idx, scenario_idx]`, we need to:

**Option A**: Flatten index
- Index = `param_idx * num_scenarios + scenario_idx`
- Single gather operation
- Requires computing the index: `idx_ParamName * num_scenarios + SelectedScenario`

**Option B**: Two-stage gather
- First gather: `gather(ScenarioTensor, idx_ParamName)` → gets row for parameter
- Second gather: `gather(row_result, SelectedScenario)` → gets specific scenario value
- Requires two gather operations and intermediate variable

**Option C**: Slice then gather
- Slice: `slice(ScenarioTensor, idx_ParamName)` → gets row
- Gather: `gather(sliced_row, SelectedScenario)` → gets value
- Similar to Option B

**Recommendation**: Option A (flattened index) is simplest and most efficient.

### Group Placement

- Create group at a fixed location (e.g., top-right corner)
- Or: Let user position it
- Group should be collapsible/expandable for clean canvas

### Error Handling

- Validate CSV structure before construction
- Handle missing values gracefully
- Provide clear error messages
- Rollback on failure (or mark as incomplete)

## Future Enhancements

1. **Expression-based initial values**: If Minsky supports `gather()` in expressions, eliminate wires
2. **Scenario presets**: Save/load scenario selections
3. **Scenario comparison**: Compare two scenarios side-by-side
4. **Parameter sensitivity**: Analyze parameter impact across scenarios
5. **Export scenarios**: Export current scenario values back to CSV
