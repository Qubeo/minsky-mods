# Minsky Model DSL Foundation Documentation

**Version:** 1.0
**Last Updated:** 2025-11-08
**Status:** Foundation / Phase 1 In Progress

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Vision](#project-vision)
3. [Architectural Design](#architectural-design)
4. [Technical Foundation](#technical-foundation)
5. [DSL Specification](#dsl-specification)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Current State](#current-state)
8. [Development Guidelines](#development-guidelines)
9. [References](#references)

---

## Executive Summary

### What We're Building

A **Domain-Specific Language (DSL)** abstraction layer for Minsky economic modeling that enables:

1. **AI-powered model generation** from natural language descriptions
2. **Bidirectional translation** between Canvas API, DSL, and .mky file format
3. **Economic pattern composition** for regenerative economics modeling
4. **Multi-capital modeling** (financial, material, energy, carbon)

### Strategic Position

This DSL sits at the convergence of:
- **Minsky's simulation engine** (.mky format, C++ backend, Godley tables)
- **AI/LLM capabilities** (Claude generating economic models from descriptions)
- **Regenerative economics frameworks** (Doughnut Economics, pattern languages)

### Core Insight

The .mky file format is Minsky's low-level DSL. By building a clean abstraction layer over it, we get:
- ✅ Declarative, queryable model representation
- ✅ Compatibility with existing Minsky models
- ✅ Foundation for economic pattern composition
- ✅ Ability to evolve models over time (read → modify → save)

---

## Project Vision

### The Four-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Economic Pattern Language (Future)             │
│ - Domain concepts: "Phillips curve", "circular economy" │
│ - Composable economic primitives                        │
│ - Retains semantic/economic meaning                     │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 2: Minsky Model DSL (CURRENT FOCUS)              │
│ - Clean, declarative model specification                │
│ - TypeScript interfaces + JSON schemas                  │
│ - Bridges semantic intent ↔ technical implementation    │
│ - Bidirectional: DSL ↔ Canvas API ↔ .mky format        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 3: .mky File Format (Minsky Native)              │
│ - Schema3 XML/JSON serialization                        │
│ - Items, Wires, Ports, Godley tables                    │
│ - No semantic meaning (pure graph structure)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Layer 4: Canvas Imperative API (Minsky Backend)        │
│ - minsky.canvas.addVariable(), addOperation()           │
│ - Direct C++ backend calls via REST API                 │
│ - Lowest level, most coupled to implementation          │
└─────────────────────────────────────────────────────────┘
```

### Long-Term Goals

**Phase 1 (Weeks 1-4):** DSL foundation + basic .mky generation
**Phase 2 (Weeks 5-8):** Multi-capital Godley table support
**Phase 3 (Weeks 9-12):** Economic pattern library & composition
**Phase 4 (Weeks 13-16):** Regenerative constraint validation
**Phase 5 (Weeks 17-24):** Advanced composition & optimization

### Use Cases We Enable

1. **AI Model Generation**: "Create a model of bank lending to households" → valid .mky file
2. **Model Evolution**: Load existing .mky → query structure → modify → save
3. **Pattern Composition**: "Combine circular economy with community ownership" → integrated model
4. **Cross-Capital Analysis**: Financial flows + energy flows + carbon accounting in one model
5. **Educational Tool**: Students learn economics through natural language model building

---

## Architectural Design

### Design Principles

1. **Minsky Core Integrity**: Never modify Minsky's .mky parser, solver, or validation logic
2. **Bidirectional Translation**: DSL ↔ Canvas ↔ .mky (all directions supported)
3. **Validation-Driven**: Every generated model must pass Minsky's internal consistency checks
4. **Extensibility**: Support simple models now, Godley tables next, patterns later
5. **Metadata-Aware**: Semantic annotations separate from simulation data
6. **Epistemic Honesty**: Explicit about what cannot be modeled

### Key Interfaces

#### 1. DSL → Canvas Translation
```typescript
Input:  MinskyModel (declarative specification)
Output: Visual model on Minsky canvas
Method: MinskyModelBuilder.buildOnCanvas()
```

#### 2. DSL → .mky Translation
```typescript
Input:  MinskyModel (declarative specification)
Output: Valid .mky file (Schema3 format)
Method: MinskyModelBuilder.toMkyFile()
```

#### 3. .mky → DSL Translation
```typescript
Input:  .mky file path
Output: MinskyModel (declarative specification)
Method: MinskyModelBuilder.fromMkyFile()
```

#### 4. Canvas → DSL Extraction
```typescript
Input:  Current canvas state
Output: MinskyModel (declarative specification)
Method: MinskyModelBuilder.fromCanvas()
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│ AI/LLM Layer (Claude)                                    │
│ - Natural language → ModelSpec                           │
│ - Model querying and explanation                         │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ Minsky Model DSL (TypeScript)                           │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Core Types & Interfaces                         │    │
│  │ - MinskyModel, VariableSpec, OperationSpec      │    │
│  │ - WireSpec, GodleyTableSpec, PatternSpec        │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ MinskyModelBuilder                              │    │
│  │ - buildOnCanvas()                               │    │
│  │ - toMkyFile() / fromMkyFile()                   │    │
│  │ - validate()                                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Validators                                      │    │
│  │ - Stock-flow consistency                        │    │
│  │ - Cross-capital linkage                         │    │
│  │ - Pattern compatibility                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Schema3 Parser/Generator                        │    │
│  │ - Parse .mky XML/JSON                           │    │
│  │ - Generate valid Schema3 output                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
          ┌──────────▼──────┐   ┌───▼──────────────┐
          │ Canvas API      │   │ .mky File I/O    │
          │ (Minsky REST)   │   │ (File System)    │
          └─────────────────┘   └──────────────────┘
```

---

## Technical Foundation

### Minsky Architecture Overview

**Stack:**
- **Frontend**: Angular + TypeScript (Electron app)
- **Backend**: C++ (economic simulation engine)
- **Bridge**: REST API over HTTP (TypeScript proxies ↔ C++ methods)
- **Persistence**: .mky files (Schema3 XML/JSON format)

**Key Concepts:**

1. **Items**: Variables, Operations, Godley tables, Plots
2. **Ports**: Input/output connection points on items
3. **Wires**: Connections between ports (represent data flow)
4. **Groups**: Containers for organizing items
5. **Godley Tables**: Double-entry bookkeeping structures (enforce conservation laws)

### Critical Files & Locations

#### Frontend (TypeScript/Angular)
```
minsky-src/gui-js/
├── apps/minsky-electron/src/app/
│   └── managers/
│       └── CommandsManager.ts          # Current AI model generation code
│
├── libs/shared/src/lib/backend/
│   └── minsky.ts                       # Auto-generated REST API bindings
│
└── libs/ui-components/                 # Angular UI components
```

#### Backend (C++)
```
minsky-src/
├── model/
│   ├── group.h                         # Wire/item management (addWire signature)
│   └── group.cc                        # Wire creation implementation
│
├── schema/
│   ├── schema3.h                       # Schema3 data structures
│   └── schema3.cc                      # Serialization/deserialization logic
│
└── minsky.cc                           # Main Minsky class (load/save)
```

### REST API Details

**How Items Are Created:**
```typescript
// TypeScript frontend calls
await minsky.canvas.addVariable("GDP", "flow");
await minsky.canvas.itemFocus.m_x(100);
await minsky.canvas.itemFocus.m_y(200);

// Translates to HTTP calls
POST /minsky/canvas/addVariable
POST /minsky/canvas/itemFocus/m_x
POST /minsky/canvas/itemFocus/m_y

// C++ backend executes
Canvas::addVariable(string name, string type)
Item::m_x(double x)
Item::m_y(double y)
```

**How Wires Are Created:**
```typescript
// C++ signature (from group.h:175-176)
WirePtr addWire(const Item& from, const Item& to, unsigned toPortIdx)

// TypeScript usage
const fromItem = minsky.namedItems.elem("GDP");
const toItem = minsky.namedItems.elem("consumption");
await minsky.canvas.model.addWire(fromItem, toItem, 1);
```

### .mky File Format (Schema3)

**Structure:**
```xml
<Minsky>
  <schemaVersion>3</schemaVersion>
  <model>
    <items>
      <Item>
        <id>0</id>
        <type>Variable:flow</type>
        <name>GDP</name>
        <x>100</x>
        <y>200</y>
        <ports>[1, 2]</ports>
      </Item>
      <!-- more items -->
    </items>
    <wires>
      <Wire>
        <id>5</id>
        <from>1</from>  <!-- port id -->
        <to>2</to>      <!-- port id -->
      </Wire>
    </wires>
    <groups>
      <!-- nested groups -->
    </groups>
  </model>
</Minsky>
```

**Key Insight:** Schema3 uses integer IDs to reference items and ports. Deserialization (schema3.cc:636-848):

1. Creates `IdMap` mapping C++ object pointers → integer IDs
2. Serializes all items, storing their port IDs
3. Serializes wires using port ID references
4. On load: reverses the process (ID → object pointer)

**Critical Code (schema3.cc:748-753):**
```cpp
// Wire deserialization
for (const auto& w: wires)
  if (portMap.contains(w.to) && portMap.contains(w.from))
    {
      populateWire(
        *g.addWire(new minsky::Wire(portMap[w.from], portMap[w.to])),
        w
      );
    }
```

This shows wires are created from Port weak_ptrs, not Item references.

### namedItems API

**Purpose:** Retrieve items by unique name (string key)

```typescript
// Available globally
minsky.namedItems: Map<string, Item>

// Usage
const gdp = minsky.namedItems.elem("GDP");           // Variable (user-provided name)
const op = minsky.namedItems.elem("__ai_op_123");    // Operation (generated unique name)

// Behind the scenes (C++)
map<string, ItemPtr> namedItems;  // Global registry
```

**Item Naming:**
- **Variables**: Use their actual name (`"GDP"`, `"consumption"`)
- **Operations**: Must be explicitly named via `minsky.nameCurrentItem(name)`
- **After creation**: Item added to `namedItems` automatically

---

## DSL Specification

### Core Type Definitions

```typescript
/**
 * Complete specification of a Minsky economic model
 *
 * Extensible from simple models (variables/ops/wires)
 * to complex regenerative models (Godley tables, patterns, multi-capital)
 */
export interface MinskyModel {
  /** Metadata about the model */
  metadata?: ModelMetadata;

  /** Model components (Phase 1) */
  variables?: VariableSpec[];
  operations?: OperationSpec[];
  wires?: WireSpec[];
  notes?: NoteSpec[];

  /** Advanced components (Phase 2+) */
  godleyTables?: GodleyTableSpec[];
  groups?: GroupSpec[];

  /** Pattern composition (Phase 3+) */
  patterns?: PatternReference[];

  /** Regenerative economics (Phase 4+) */
  regenerativeMetrics?: RegenerativeMetadata;
}

/**
 * Model metadata (separate from simulation data)
 */
export interface ModelMetadata {
  name?: string;
  description?: string;
  author?: string;
  created?: string;
  version?: string;
  tags?: string[];
  economicFramework?: 'mainstream' | 'post-keynesian' | 'ecological' | 'regenerative';
}

/**
 * Variable specification
 */
export interface VariableSpec {
  /** Unique identifier within this model (for wire references) */
  id: string;

  /** Variable name (shown in UI, used in equations) */
  name: string;

  /** Variable type */
  type: 'flow' | 'stock' | 'parameter' | 'integral' | 'constant';

  /** Position on canvas */
  position: Position;

  /** Initial value (for parameters/constants) */
  initialValue?: number;

  /** Units (e.g., "USD/month", "kWh", "tCO2eq") */
  units?: string;

  /** Semantic metadata */
  description?: string;
  tooltip?: string;
}

/**
 * Operation specification
 */
export interface OperationSpec {
  /** Unique identifier within this model */
  id: string;

  /** Operation type (matches Minsky's OperationType enum) */
  type: OperationType;

  /** Position on canvas */
  position: Position;

  /** Optional name (for clarity in complex models) */
  name?: string;

  /** Operation-specific parameters */
  parameters?: {
    axis?: string;      // For index operations
    arg?: number;       // For functions taking arguments
  };
}

/**
 * Wire/connection specification
 */
export interface WireSpec {
  /** Source item ID (from VariableSpec.id or OperationSpec.id) */
  from: string;

  /** Destination item ID */
  to: string;

  /** Destination port index (default: 1 for first input port) */
  toPort?: number;

  /** Optional control points for visual routing */
  coordinates?: number[];

  /** Semantic meaning of this connection */
  description?: string;
}

/**
 * Note/annotation specification
 */
export interface NoteSpec {
  text: string;
  position: Position;
  detailedText?: string;
}

/**
 * Position on canvas
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Godley table specification (Phase 2)
 */
export interface GodleyTableSpec {
  id: string;
  name: string;

  /** Column definitions */
  assetColumns: string[];
  liabilityColumns: string[];

  /** Row definitions (flows) */
  flows: GodleyFlowSpec[];

  /** Capital type (for multi-capital modeling) */
  capitalType?: 'financial' | 'energy' | 'material' | 'carbon';

  /** Units for this table */
  units?: string;
}

/**
 * Flow within a Godley table
 */
export interface GodleyFlowSpec {
  name: string;

  /** Entries for each column (positive for assets, negative for liabilities) */
  entries: { [columnName: string]: string | number };
}

/**
 * Economic pattern reference (Phase 3)
 */
export interface PatternReference {
  /** Pattern identifier from library */
  patternId: string;

  /** Parameters to customize pattern instance */
  parameters?: { [key: string]: any };

  /** How this pattern connects to rest of model */
  bindings?: { [patternVariable: string]: string };
}

/**
 * Regenerative economics metadata (Phase 4)
 */
export interface RegenerativeMetadata {
  /** Doughnut economics boundaries */
  planetaryBoundaries?: {
    climateChange?: { value: number; unit: string; threshold: number };
    biodiversity?: { value: number; unit: string; threshold: number };
    // ... other boundaries
  };

  socialFoundation?: {
    [need: string]: { met: boolean; metric: number };
  };

  /** Circularity metrics */
  circularityRatio?: number;

  /** Distribution metrics */
  giniCoefficient?: number;
}

/**
 * Minsky operation types (from C++ OperationType enum)
 */
export type OperationType =
  | 'constant' | 'time'
  | 'add' | 'subtract' | 'multiply' | 'divide'
  | 'log' | 'pow' | 'exp' | 'sqrt'
  | 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan'
  | 'integrate' | 'differentiate'
  | 'data' | 'ravel' | 'userFunction'
  | 'lt' | 'le' | 'eq' | 'min' | 'max' | 'and' | 'or' | 'not'
  | 'polygamma' | 'gamma' | 'fact' | 'copy';
```

### Validation Rules

**Stock-Flow Consistency (for Godley tables):**
```typescript
function validateStockFlowConsistency(table: GodleyTableSpec): ValidationResult {
  // Each flow row must sum to zero across all columns
  for (const flow of table.flows) {
    const sum = Object.values(flow.entries).reduce((a, b) => a + b, 0);
    if (Math.abs(sum) > EPSILON) {
      return { valid: false, error: `Flow "${flow.name}" does not balance (sum=${sum})` };
    }
  }
  return { valid: true };
}
```

**Cross-Capital Linkage (for multi-capital models):**
```typescript
function validateCrossCapitalLink(
  fromTable: GodleyTableSpec,
  toTable: GodleyTableSpec,
  linkVariable: VariableSpec
): ValidationResult {
  // Units must be compatible with conversion factor
  if (!unitsAreCompatible(fromTable.units, toTable.units, linkVariable.units)) {
    return {
      valid: false,
      error: `Incompatible units: ${fromTable.units} → ${toTable.units} via ${linkVariable.units}`
    };
  }
  return { valid: true };
}
```

**Wire Validity:**
```typescript
function validateWire(wire: WireSpec, model: MinskyModel): ValidationResult {
  // Source and destination must exist
  const fromExists = findItem(model, wire.from);
  const toExists = findItem(model, wire.to);

  if (!fromExists) {
    return { valid: false, error: `Wire source "${wire.from}" not found` };
  }
  if (!toExists) {
    return { valid: false, error: `Wire destination "${wire.to}" not found` };
  }

  // Port index must be valid for destination
  if (wire.toPort && wire.toPort >= getPortCount(toExists)) {
    return { valid: false, error: `Invalid port index ${wire.toPort} for item "${wire.to}"` };
  }

  return { valid: true };
}
```

---

## Implementation Roadmap

### Phase 1a: DSL Foundation (Weeks 1-2) ⬅️ **CURRENT**

**Objective:** Build clean DSL abstraction with bidirectional Canvas support

**Deliverables:**
1. ✅ TypeScript type definitions (MinskyModel, VariableSpec, etc.)
2. 🔄 MinskyModelBuilder class (Canvas translation only)
3. 🔄 Validation utilities
4. ⬜ Test harness (automated Canvas validation)

**Success Criteria:**
- [ ] Can define a model in DSL and generate it on Canvas
- [ ] All items positioned correctly
- [ ] All wires connect properly
- [ ] Model is interactive in Minsky UI

**Code Location:** `/minsky-src/gui-js/libs/shared/src/lib/dsl/` (new directory)

### Phase 1b: .mky Bidirectional Support (Weeks 3-4)

**Objective:** Enable reading and writing .mky files

**Deliverables:**
1. Schema3 parser (XML/JSON → MinskyModel)
2. Schema3 generator (MinskyModel → XML/JSON)
3. File I/O utilities
4. .mky validation against Minsky

**Success Criteria:**
- [ ] Can load existing .mky file → DSL
- [ ] Can generate DSL → .mky file
- [ ] Generated .mky files open in Minsky without errors
- [ ] Roundtrip: .mky → DSL → .mky preserves model

**Code Location:** `/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/`

### Phase 2: Godley Table Support (Weeks 5-8)

**Objective:** Enable stock-flow consistent modeling

**Deliverables:**
1. GodleyTableSpec implementation
2. Godley table → Canvas generation
3. Godley table → .mky serialization
4. Stock-flow consistency validator

**Success Criteria:**
- [ ] Can generate simple two-sector Godley model
- [ ] Accounting balance validated automatically
- [ ] Model simulates correctly in Minsky
- [ ] LLM can generate "bank lending to households" model

**Code Location:** `/minsky-src/gui-js/libs/shared/src/lib/dsl/godley/`

### Phase 3: Pattern Library (Weeks 9-12)

**Objective:** Composable economic patterns

**Deliverables:**
1. Pattern specification format
2. Pattern library (10+ validated patterns)
3. Pattern composition validator
4. Pattern → Model compiler

**Success Criteria:**
- [ ] Pattern library contains: credit creation, circular economy, renewable energy, etc.
- [ ] Patterns can be composed (with conflict detection)
- [ ] User can request "combine pattern A + pattern B"
- [ ] LLM generates correct composed models

**Code Location:** `/minsky-src/gui-js/libs/shared/src/lib/dsl/patterns/`

### Phase 4: Multi-Capital & Regenerative (Weeks 13-16)

**Objective:** Multi-capital modeling with regenerative validation

**Deliverables:**
1. Multi-capital Godley table support
2. Cross-capital linkage with unit conversion
3. Regenerative metrics calculator
4. Doughnut boundary checker

**Success Criteria:**
- [ ] Can model financial + energy + carbon simultaneously
- [ ] Cross-capital flows validated
- [ ] Planetary boundaries checked
- [ ] Circularity/distribution metrics computed

**Code Location:** `/minsky-src/gui-js/libs/shared/src/lib/dsl/regenerative/`

---

## Current State

### What Works (As of 2025-11-08)

✅ **AI Model Generation**
- Claude generates JSON model specifications from natural language
- Variables created and positioned correctly via Canvas API
- Operations created with unique generated names
- Items stored in `namedItems` registry

✅ **Item Creation Pattern**
```typescript
// Variables
await minsky.canvas.addVariable(name, type);
await minsky.canvas.itemFocus.m_x(x);
await minsky.canvas.itemFocus.m_y(y);
// Accessible via: minsky.namedItems.elem(name)

// Operations
await minsky.canvas.addOperation(type);
await minsky.canvas.itemFocus.m_x(x);
await minsky.canvas.itemFocus.m_y(y);
await minsky.nameCurrentItem(uniqueName);
// Accessible via: minsky.namedItems.elem(uniqueName)
```

### What's In Progress

🔄 **Wire Creation**
- Identified correct C++ signature: `addWire(Item& from, Item& to, unsigned toPortIdx)`
- Need to fix current implementation to use Item objects directly (not Port objects)

**Current code (incorrect):**
```typescript
const fromPort = await fromItem.ports(0);
const toPort = await toItem.ports(toPortIdx);
await minsky.canvas.model.addWire(fromPort, toPort);  // Returns {}
```

**Should be:**
```typescript
const fromItem = minsky.namedItems.elem(fromName);
const toItem = minsky.namedItems.elem(toName);
await minsky.canvas.model.addWire(fromItem, toItem, toPortIdx);
```

### What's Next (Immediate)

1. **Fix wire creation** using correct signature
2. **Test end-to-end** model generation (variables + operations + wires)
3. **Extract to DSL abstraction** (refactor CommandsManager.ts)
4. **Build MinskyModelBuilder** class with clean interfaces

### File Status

**Modified Files:**
- `/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts`
  - Line ~1566-1656: AI model generation implementation
  - Status: Wire creation needs fix, rest functional

**New Files (To Be Created):**
- `/minsky-src/gui-js/libs/shared/src/lib/dsl/types.ts` (DSL type definitions)
- `/minsky-src/gui-js/libs/shared/src/lib/dsl/MinskyModelBuilder.ts` (main builder class)
- `/minsky-src/gui-js/libs/shared/src/lib/dsl/validators.ts` (validation utilities)
- `/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/parser.ts` (.mky parser)
- `/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/generator.ts` (.mky generator)

---

## Development Guidelines

### Code Organization

```
minsky-src/gui-js/libs/shared/src/lib/
└── dsl/
    ├── index.ts                      # Public API exports
    ├── types.ts                      # Core type definitions
    ├── MinskyModelBuilder.ts         # Main builder class
    ├── validators.ts                 # Validation utilities
    │
    ├── canvas/                       # Canvas API translation
    │   ├── CanvasTranslator.ts
    │   └── helpers.ts
    │
    ├── schema3/                      # .mky file format
    │   ├── parser.ts
    │   ├── generator.ts
    │   └── types.ts
    │
    ├── godley/                       # Godley table support (Phase 2)
    │   ├── GodleyTableBuilder.ts
    │   └── validators.ts
    │
    ├── patterns/                     # Pattern library (Phase 3)
    │   ├── PatternLibrary.ts
    │   ├── PatternComposer.ts
    │   └── patterns/
    │       ├── credit-creation.ts
    │       ├── circular-economy.ts
    │       └── ...
    │
    └── regenerative/                 # Regenerative economics (Phase 4)
        ├── RegenerativeValidator.ts
        └── metrics.ts
```

### Testing Strategy

**Unit Tests:**
```typescript
describe('MinskyModelBuilder', () => {
  it('should create variables from spec', async () => {
    const spec: VariableSpec = {
      id: 'gdp',
      name: 'GDP',
      type: 'flow',
      position: { x: 100, y: 100 }
    };

    const builder = new MinskyModelBuilder();
    const item = await builder.createVariable(spec);

    expect(item).toBeDefined();
    expect(await item.m_x()).toBe(100);
    expect(await item.m_y()).toBe(100);
  });
});
```

**Integration Tests:**
```typescript
describe('Full model generation', () => {
  it('should generate simple economic model', async () => {
    const model: MinskyModel = {
      variables: [
        { id: 'c', name: 'consumption', type: 'flow', position: { x: 100, y: 100 } },
        { id: 'i', name: 'investment', type: 'flow', position: { x: 100, y: 200 } },
        { id: 'gdp', name: 'GDP', type: 'flow', position: { x: 300, y: 150 } },
      ],
      operations: [
        { id: 'add1', type: 'add', position: { x: 200, y: 150 } }
      ],
      wires: [
        { from: 'c', to: 'add1', toPort: 1 },
        { from: 'i', to: 'add1', toPort: 2 },
        { from: 'add1', to: 'gdp' }
      ]
    };

    const builder = new MinskyModelBuilder();
    await builder.buildOnCanvas(model);

    // Verify model exists on canvas
    const wiresSize = await minsky.model.wires.size();
    expect(wiresSize).toBe(3);
  });
});
```

**Validation Tests:**
```typescript
describe('Schema3 roundtrip', () => {
  it('should preserve model through .mky conversion', async () => {
    const original = loadTestModel('simple-economy.json');
    const builder = new MinskyModelBuilder();

    // DSL → .mky → DSL
    const mkyContent = await builder.toMkyFile(original);
    const parsed = await builder.fromMkyFile(mkyContent);

    expect(parsed).toEqual(original);
  });
});
```

### Coding Standards

**Naming Conventions:**
```typescript
// Interfaces: PascalCase with "Spec" or "Definition" suffix
interface VariableSpec { }
interface WireDefinition { }

// Classes: PascalCase
class MinskyModelBuilder { }

// Functions: camelCase with verb prefix
async function validateModel(model: MinskyModel): Promise<ValidationResult>
async function buildOnCanvas(model: MinskyModel): Promise<void>

// Constants: UPPER_SNAKE_CASE
const MAX_WIRE_LENGTH = 1000;
const DEFAULT_PORT_INDEX = 1;
```

**Error Handling:**
```typescript
// Custom error types
class ModelValidationError extends Error {
  constructor(public issues: ValidationIssue[]) {
    super(`Model validation failed: ${issues.length} issues found`);
  }
}

// Validation result pattern
interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Always validate before generation
async function buildOnCanvas(model: MinskyModel): Promise<void> {
  const validation = await validateModel(model);
  if (!validation.valid) {
    throw new ModelValidationError(validation.errors);
  }

  // Proceed with generation...
}
```

**Documentation:**
```typescript
/**
 * Builds a Minsky model on the canvas from a declarative specification.
 *
 * This method clears the current canvas and creates all items (variables,
 * operations, Godley tables) and connections (wires) specified in the model.
 *
 * @param model - The declarative model specification
 * @param options - Optional build configuration
 * @returns Promise that resolves when model is built
 * @throws ModelValidationError if model is invalid
 * @throws MinskyAPIError if Minsky backend calls fail
 *
 * @example
 * ```typescript
 * const model: MinskyModel = {
 *   variables: [{ id: 'gdp', name: 'GDP', type: 'flow', position: { x: 100, y: 100 } }]
 * };
 * await builder.buildOnCanvas(model);
 * ```
 */
async function buildOnCanvas(
  model: MinskyModel,
  options?: BuildOptions
): Promise<void>
```

### Git Workflow

**Branch Strategy:**
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/dsl-foundation` - Current work (Phase 1a)
- `feature/mky-parser` - .mky support (Phase 1b)
- `feature/godley-tables` - Godley support (Phase 2)

**Commit Messages:**
```
feat(dsl): Add MinskyModelBuilder class with Canvas translation
fix(wire): Use correct Item-based addWire signature
docs(foundation): Create comprehensive DSL documentation
test(integration): Add end-to-end model generation tests
refactor(commands): Extract DSL logic from CommandsManager
```

---

## References

### Key Documentation

1. **Minsky Plugin Design Brief**: `/minsky/docs/minsky-plugin-design-brief-v1.md`
2. **This Document**: `/minsky/docs/minsky-dsl-foundation.md`
3. **Minsky Source**: `/minsky/minsky-src/`
4. **TypeScript API Bindings**: `/minsky/minsky-src/gui-js/libs/shared/src/lib/backend/minsky.ts`

### Key Source Files

**C++ Backend:**
- `/minsky-src/model/group.h` - Wire creation signatures (line 61-180)
- `/minsky-src/model/group.cc` - Wire creation implementation (line 679-709)
- `/minsky-src/schema/schema3.h` - Schema3 data structures
- `/minsky-src/schema/schema3.cc` - Serialization/deserialization (line 636-848)

**TypeScript Frontend:**
- `/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts` - Current AI model generation (line 1540-1670)
- `/minsky-src/gui-js/libs/shared/src/lib/backend/minsky.ts` - Auto-generated REST API bindings

### External Frameworks

**Theoretical Foundation:**
- **Beige's Economic Pattern Language**: Composable economic primitives
- **Hedges' Categorical Cybernetics**: Formal composition machinery
- **Raworth's Doughnut Economics**: Regenerative boundaries framework

**Technical References:**
- Minsky GitHub: https://github.com/highperformancecoder/minsky
- Stock-Flow Consistent Modeling: Godley & Lavoie (2007)
- Regenerative Economics: Raworth (2017) "Doughnut Economics"

---

## Appendix: Key Concepts

**DSL (Domain-Specific Language):** A specialized programming language designed for a particular domain (economic modeling in our case). Declarative rather than imperative.

**Declarative vs Imperative:**
- **Imperative**: "Add a variable, then move it to (100, 100), then add an operation..." (how to build)
- **Declarative**: "The model has variable GDP at (100, 100) and operation Add at (200, 200)..." (what to build)

**Bidirectional Translation:** Converting between representations in both directions (DSL ↔ Canvas, DSL ↔ .mky) without loss of information.

**Stock-Flow Consistency (SFC):** Economic modeling approach where all financial flows are tracked such that one entity's asset is another's liability. No money appears or disappears.

**Godley Table:** Double-entry bookkeeping table invented by Wynne Godley. Rows are flows (transactions), columns are accounts, enforcing `Assets - Liabilities - Equity = 0`.

**Conservation Law:** Physical/mathematical principle that a quantity (mass, energy, money) is neither created nor destroyed, only transformed or transferred.

**Schema3:** Minsky's current file format version for serializing models to disk. XML/JSON structure with items, wires, groups, Godley tables.

**Port:** Connection point on a Minsky item. Output port (index 0) produces a value; input ports (index 1+) consume values.

**Wire:** Connection between ports representing data flow. In economic terms: causal relationship or accounting flow.

**Item:** Generic term for any Minsky canvas object (Variable, Operation, Godley table, Plot, etc.)

**Multi-Capital:** Modeling multiple types of capital simultaneously (financial, natural, social, manufactured) with feedback loops between them.

**Pattern (Economic):** Reusable structure describing a recurring economic mechanism (e.g., "credit creation", "circular material flow", "renewable energy integration").

**Regenerative Economics:** Economic activity that restores rather than depletes natural and social capitals. Operates within planetary boundaries and social foundations.

---

**Last Updated:** 2025-11-08
**Document Status:** Living document - will be updated as implementation progresses
**Next Review:** After Phase 1a completion
