# Scenario Grower Architecture

## Overview

The **Scenario Grower** mod implements a tensor-based scenario infrastructure system based on best-practice software architecture principles:

- **Single Source of Truth (SST)**: CSV file is authoritative
- **Semantic Clarity**: Named indices instead of magic numbers
- **Separation of Concerns**: Construction, infrastructure control, and variable definition are clean and independent
- **Flexibility**: Supports both scenario-dependent and scenario-independent parameters

## Architecture

### Part 1: CSV as SST

**Format**: `name,type,units,description,init,scenario1,scenario2,...`

Example:
```csv
name,type,units,description,init,CON,OPT,IDL
InnovationRate,parameter,1/year,Rate of innovation,,0.02,0.04,0.06
PopulationSize,parameter,people,Total population,1000000,,
TimeHorizon,constant,years,Simulation duration,50,,
```

**Key features:**
- **name**: Variable identifier
- **type**: `parameter`, `constant`, or `flow`
- **units**: For dimensional analysis
- **description**: Tooltip documentation
- **init**: Static initial value (for non-scenario variables)
- **Scenario columns**: Any number of named scenarios (CON, OPT, IDL, etc.)

### Part 2: Scenario Infrastructure

The mod creates two classes of variables:

#### A. Scenario-Dependent Parameters (with scenario column values)

```
Group: Scenario Infrastructure
├── ScenarioTensor
│   └── Flattened 2D matrix: [param0_scen0, param0_scen1, ..., param1_scen0, ...]
│
├── SelectedScenario
│   └── Control parameter (0 = first scenario, 1 = second, etc.)
│
├── For each parameter:
│   ├── idx_ParamName (constant)
│   │   └── Value: parameter's row index (0, 1, 2, ...)
│   │
│   └── ParamName (parameter)
│       └── Populated by gather operation from ScenarioTensor
```

**How it works:**
- `idx_ParamName` semantic indices prevent magic number indexing
- `SelectedScenario` controls which scenario column is active
- Gather operation wires: `ScenarioTensor[idx_ParamName * numScenarios + SelectedScenario]`
- ParamName variables auto-update when SelectedScenario changes

#### B. Static Parameters (only init value, no scenarios)

```
└── ParamName (parameter or constant)
    └── Initialized to init value
    └── Not wired, no scenario dependency
```

### Part 3: Components

#### CsvParser
- Parses enriched SST CSV format
- Identifies core columns (name, type, units, description, init)
- Auto-detects scenario columns (everything after init)
- Returns `ScenarioData` with typed `ParameterInfo[]`

#### ScenarioTensorBuilderService
- Creates tensor infrastructure from `ScenarioData`
- Separates scenario-dependent vs scenario-independent parameters
- Creates flattened tensor for 2D indexing
- Positions variables on canvas with intelligent layout

#### ScenarioGrowerComponent
- User selects CSV file
- Previews parameter summary
- Triggers infrastructure creation
- Provides feedback on success/failure

## Implementation Workflows

### Workflow A: Grow from CSV (Full Stack)

```
1. User selects CSV file
   ↓
2. CsvParser.parse(csvText) → ScenarioData
   ↓
3. ScenarioGrowerComponent displays preview
   ↓
4. User clicks "Grow Infrastructure"
   ↓
5. ScenarioTensorBuilderService.buildInfrastructure(data)
   - Creates ScenarioTensor with flattened data
   - Creates SelectedScenario control
   - For each scenario-dependent param:
     * Creates idx_ParamName constant
     * Creates ParamName variable
   - For each static param:
     * Creates variable with init value
   ↓
6. Infrastructure ready on canvas
```

### Workflow B: Wire from Existing Tensor (Manual Tensor Creation)

User manually:
1. Creates ScenarioTensor variable
2. Populates via "Import CSV" (Simulation → Import Data)

Then uses "Wire Scenario Parameters..." menu:

```
1. User opens "Wire Scenario Parameters..." dialog
   ↓
2. Enter:
   - Tensor variable name (e.g., "ScenarioTensor")
   - Parameter names (one per line or comma-separated)
   - Scenario names (one per line or comma-separated)
   - SelectedScenario variable name (optional, defaults to "SelectedScenario")
   ↓
3. ScenarioWiringService.wireScenarioParameters(...)
   - Verifies tensor variable exists
   - Creates SelectedScenario control (if needed)
   - For each parameter:
     * Creates idx_ParamName constant
     * Creates ParamName variable
     * (TODO: Wire gather operations)
   ↓
4. Infrastructure ready to wire
   - User can manually wire gather operations if needed
   - Or system auto-wires (future enhancement)
```

## CSV Column Flexibility

The parser intelligently identifies columns by name (case-insensitive):
- Must have: `name` column
- Optional: `type`, `units`, `description`, `init`
- Scenario columns: Auto-detected (all others)
- Missing columns default gracefully

## Benefits

✓ **SST Principle**: CSV is single source of truth for all scenario data
✓ **Semantic Clarity**: `idx_InnovationRate` >> magic number `0`
✓ **Flexibility**: Mix scenario-dependent and static parameters
✓ **Auditability**: Structure visible, inspectable, reproducible
✓ **Extensibility**: Add scenarios or parameters without code changes
✓ **Separation**: Infrastructure variables isolated from user model

## Future Enhancements

- **Wiring**: Implement gather operation wiring for live scenario updates
- **Consistency Checker**: Validate model matches CSV, detect drift
- **Scenario Presets**: Save/load scenario selections
- **Two-Stage Gather**: For complex tensor indexing if needed
- **Group Management**: Auto-collapse/expand infrastructure group
