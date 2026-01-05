# Economic Pattern Language (EPL) Specification

**Version:** 0.1 (Draft)
**Date:** 2025-12-01

## 1. Overview

The Economic Pattern Language (EPL) is a high-level semantic layer designed to describe economic structures, dynamics, and frameworks. It sits above the Minsky Model DSL, serving as a bridge between raw computational models (variables, wires, equations) and economic theory (institutions, flows, feedback loops).

**Purpose:**
1.  **Compression:** Describe complex subsystems as single semantic units.
2.  **Reasoning:** Enable AI agents to reason about the *economic* validity of a model, not just its mathematical consistency.
3.  **Composition:** Facilitate the construction of models by assembling known economic blocks.

## 2. Pattern Schema

A valid EPL Pattern is defined by the following JSON schema:

```typescript
interface EconomicPattern {
  // Unique identifier for the pattern type
  id: string; 
  
  // Parent pattern this extends (e.g., "p_diffusion" -> "p_bass")
  extends?: string;

  // Human-readable name (e.g., "Godley Table", "Debt-Deflation Spiral")
  name: string;
  
  // High-level description of the economic concept
  description: string;
  
  // The theoretical framework this pattern belongs to
  framework?: 'SFC' | 'Neoclassical' | 'SystemDynamics' | 'Ecological' | 'General';

  // Structural requirements: What must exist in the DSL for this pattern to be present?
  signature: PatternSignature;

  // Semantic components: The named roles variables play in this pattern
  roles: Record<string, RoleDefinition>;

  // Dynamics: Expected behaviors or feedback loops
  dynamics?: DynamicBehavior[];

  // Distinguishing features from parent/siblings
  differentiation?: string; 
}

interface PatternSignature {
  // Required DSL component types
  requiredComponents?: ('GodleyTable' | 'Stock' | 'Flow' | 'Group')[];
  
  // Required topological features
  topology?: {
    hasFeedbackLoop?: boolean;
    hasStockFlowConsistency?: boolean; // Checks for Godley Table balance
    minStocks?: number;
  };
}

interface RoleDefinition {
  description: string;
  type: 'stock' | 'flow' | 'parameter' | 'constant';
  optional?: boolean;
}

interface DynamicBehavior {
  name: string;
  type: 'balancing_loop' | 'reinforcing_loop' | 'oscillation' | 'collapse';
  description: string;
}
```

## 3. Pattern Types

EPL recognizes three categories of patterns:

### 3.1. Structural Patterns
Static arrangements of components that represent an institution or accounting identity.
*   **Example:** `DoubleEntryAccounting` (Godley Table)
*   **Example:** `ProductionFunction` (Inputs -> Output)

### 3.2. Dynamic Patterns
Functional relationships that drive system behavior over time.
*   **Example:** `InventoryAdjustment` (Gap between desired and actual stock drives production)
*   **Example:** `AcceleratorMechanism` (Change in output drives investment)

### 3.3. Systemic Patterns
High-level emergent behaviors or macro-structures.
*   **Example:** `GoodwinCycle` (Class struggle cycle)
*   **Example:** `FinancialInstabilityHypothesis` (Minsky Moment)

## 4. Mapping to Minsky DSL

The EPL maps to the Minsky DSL via **Signatures** and **Roles**.

*   **Signature Matching:** An AI agent (or algorithm) scans the DSL JSON. If it finds a `GodleyTable` with a specific set of column headers (e.g., "Assets", "Liabilities"), it matches the `BalanceSheet` pattern.
*   **Role Assignment:** Once a pattern is identified, specific DSL variables are assigned roles.
    *   *DSL Variable:* `Var_Reserves` (inside Godley Table)
    *   *EPL Role:* `Asset`

## 5. Example: Simple Inventory Pattern

```json
{
  "id": "inventory_adjustment",
  "name": "Inventory Adjustment Process",
  "framework": "SystemDynamics",
  "description": "Production is adjusted to close the gap between desired and actual inventory.",
  "signature": {
    "requiredComponents": ["Stock", "Flow"],
    "topology": { "hasFeedbackLoop": true }
  },
  "roles": {
    "inventory": { "type": "stock", "description": "Accumulated goods" },
    "production": { "type": "flow", "description": "Inflow to inventory" },
    "sales": { "type": "flow", "description": "Outflow from inventory" },
    "desired_inventory": { "type": "parameter", "description": "Target level" }
  },
  "dynamics": [
    {
      "name": "Correction Loop",
      "type": "balancing_loop",
      "description": "As inventory rises above desired, production is cut."
    }
  ]
}
```
