# Minsky Regenerative Economics Plugin: Design Brief

## Executive Summary

**Core Discovery:** Godley tables are domain-agnostic conservation law enforcers. The "financial" interpretation is semantic overlay, not mathematical constraint. This enables multi-capital modeling (financial, material, energy, carbon) within Minsky's existing solver—no core modifications required.

**Opportunity:** Build an LLM-powered plugin that generates, queries, and evolves economic models expressing regenerative patterns through compositional economic primitives. Users describe intent in natural language; system produces rigorous, stock-flow-consistent models spanning multiple capitals.

**Strategic Position:** This sits at the convergence of three frameworks:
- **Beige's Economic Pattern Language:** Composable economic primitives (stocks, flows, transformations)
- **Hedges' Categorical Cybernetics:** Formal machinery for bidirectional control and composition
- **Raworth's Doughnut Economics:** Regenerative design within social and ecological boundaries

**Architectural Insight:** Minsky becomes the *simulation engine* for conserved flows. The plugin provides the *semantic intelligence layer* for pattern composition, regenerative validation, and multi-capital integration.

---

## Theoretical Foundation: Why This Works

### The Mathematics Underneath Economics

Godley tables enforce: `Σ(Assets) - Σ(Liabilities) - Equity = 0`

This is not "accounting"—it's a *conservation law with partitioned semantics*. The structure applies to any conserved quantity:

- **Mass Conservation:** Material flows (kg biomass)
- **Energy Conservation:** Energy flows (kWh) 
- **Carbon Accounting:** Biogeochemical cycles (tCO2eq)
- **Financial Flows:** Monetary circuits (USD)

**Critical Insight:** Minsky's solver operates on `d(Stock)/dt = Flows`. It validates row-balance (conservation). It computes dynamics. **It never checks that stocks are "money".**

### The Semantic Gap

Traditional economics: Financial flows abstracted from physical reality.

Regenerative economics: Multiple interacting capitals (financial, natural, social, manufactured) with feedback between them.

**The Bridge:** Model each capital type as a separate Godley table. Link them through variables representing conversion rates and causal relationships. Simulate all capitals simultaneously using Minsky's proven Runge-Kutta solver.

### What Cannot Be Modeled This Way

Non-conserved quantities that violate Godley table assumptions:
- Social capital (trust, networks—not additive)
- Governance structures (qualitative)
- Information flows (non-rivalrous)
- Power dynamics (non-linear, emergent)

**Solution:** Track these in parallel metadata layer, not in .mky Godley tables.

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│ User Interface Layer                                │
│ - Natural language interaction                      │
│ - LLM-powered interpretation                        │
│ - Pattern library queries                           │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ Plugin Intelligence Layer (Your Code)               │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Pattern Compiler                             │   │
│ │ - Economic DSL → .mky + metadata             │   │
│ │ - Multi-capital Godley table generation      │   │
│ │ - Cross-domain linkage synthesis             │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Semantic Metadata Store                      │   │
│ │ - Pattern annotations (.mky.meta)            │   │
│ │ - Regenerative metrics definitions           │   │
│ │ - Non-flow relationships (governance, etc.)  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Validation & Analysis Engine                 │   │
│ │ - Cross-capital consistency checks           │   │
│ │ - Regenerative constraint validation         │   │
│ │ - Pattern composition verification           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ Minsky Simulation Engine (Unmodified)              │
│ - Parses .mky files (multi-capital Godley tables)  │
│ - Validates stock-flow consistency                  │
│ - Solves differential equations (Runge-Kutta)      │
│ - Returns time-series results                       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│ Frontend Augmentation Layer                         │
│ - Display multi-capital results                     │
│ - Visualize regenerative metrics                    │
│ - Show pattern annotations on canvas                │
│ - Provide LLM interaction UI                        │
└─────────────────────────────────────────────────────┘
```

### Key Interfaces

**1. Pattern → .mky Compilation**
```
Input:  Economic pattern specification (textual DSL or LLM-generated)
Output: Valid .mky file with multiple Godley tables + .mky.meta file
Contract: Generated model must be stock-flow consistent across all capitals
```

**2. Cross-Capital Linkage**
```
Input:  Causal relationships between capitals (e.g., investment → capacity)
Output: Minsky variables and wires connecting Godley tables
Contract: Unit conversions must be explicit and semantically valid
```

**3. Regenerative Validation**
```
Input:  Simulation results across all capitals
Output: Regenerative score (circularity, distributiveness, boundaries)
Contract: Must flag violations of planetary boundaries or social foundations
```

---

## MVP Specification: Phase 1 (Weeks 1-4)

### Objective
Validate core hypothesis: LLM can generate valid multi-capital Minsky models from natural language descriptions.

### Scope

**IN:**
- Generate simple .mky files with 1-2 Godley tables (financial only initially)
- Basic pattern recognition in existing .mky files
- LLM-driven canvas manipulation (add sectors, flows)
- Validate accounting balance in generated models

**OUT:**
- Multi-capital modeling (defer to Phase 2)
- Complex pattern composition
- Regenerative metrics calculation
- Frontend visualization enhancements

### Technical Requirements

**1. .mky File Generation**
```python
def generate_mky_from_prompt(user_prompt: str) -> str:
    """
    Input: "Create a model of bank lending to households"
    Output: Valid .mky XML with:
      - Banks Godley table (Reserves, Loans, Deposits, Bank_Equity)
      - Households Godley table (Deposits, Debt, Household_Equity)
      - Flows: "Bank Lending" connecting the two
    
    Validation:
      - Each row sums to zero
      - Initial conditions specified
      - All flow variables defined
    """
```

**2. Pattern Recognition**
```python
def extract_patterns(mky_file: str) -> dict:
    """
    Input: Existing .mky file
    Output: {
        "patterns_detected": ["endogenous_money_creation", "government_deficit"],
        "sectors": ["Banks", "Households", "Government"],
        "flows": ["Bank Lending", "Government Spending", "Taxation"]
    }
    """
```

**3. Canvas Manipulation**
```python
def add_sector_to_canvas(sector_name: str, sector_type: str):
    """
    Creates new GodleyIcon on Minsky canvas
    sector_type: "bank", "household", "firm", "government"
    Auto-populates standard accounts for type
    """

def add_flow_between_sectors(flow_name: str, from_sector: str, to_sector: str):
    """
    Creates flow entries in Godley tables
    Validates double-entry balance
    """
```

### Success Criteria

**Must Achieve:**
1. Generate syntactically valid .mky files that Minsky can open
2. All generated models pass Minsky's internal consistency checks
3. LLM can correctly identify 3+ standard patterns in example models
4. Canvas manipulation preserves accounting balance

**Validation Test:**
```
User: "Create a simple model where banks lend to households"
Expected: Model generates, opens in Minsky, simulates without error
Result: Bank loans create deposits (endogenous money) correctly
```

---

## Progressive Enhancement: Phases 2-5

### Phase 2: Multi-Capital Modeling (Weeks 5-8)

**Add:** Generation of energy, material, and carbon Godley tables

**Key Challenge:** Cross-domain linkage with correct unit conversions

**Example:**
```
User: "Model a community solar cooperative"
System generates:
  - Financial table (investment, revenue, debt)
  - Energy table (panel capacity in W, generation in kWh)
  - Carbon table (avoided emissions in tCO2eq)
  - Variables linking them ($/W panel cost, kWh→$ revenue, kWh→tCO2eq factor)
```

**Success Criterion:** Three-capital model simulates correctly; energy generation drives financial revenue; carbon accounting reflects energy flows.

### Phase 3: Pattern Library & Composition (Weeks 9-12)

**Add:** Library of regenerative economic patterns that compose

**Patterns to implement:**
1. **Credit Creation:** Banks create deposits through lending
2. **Circular Material Flow:** Waste becomes input (biological nutrients)
3. **Community Ownership:** Democratic governance, surplus distribution
4. **Renewable Energy Integration:** Solar/wind generation, storage, distribution
5. **Solidarity Finance:** Mutual credit, time banking

**Composition Rules:**
```python
def compose_patterns(pattern_a: Pattern, pattern_b: Pattern) -> Model:
    """
    Validates:
      - No conflicting sector definitions
      - Cross-pattern flows balance
      - Shared variables have consistent units
    
    Returns: Integrated model or composition error
    """
```

**Success Criterion:** User can say "Combine circular economy with community ownership" and get valid model.

### Phase 4: Regenerative Constraint Validation (Weeks 13-16)

**Add:** Doughnut economics boundary checking

**Implementation:**
```python
class RegenerativeValidator:
    def check_social_foundation(self, results) -> dict:
        """Returns which needs are met/unmet for population"""
    
    def check_ecological_ceiling(self, results) -> dict:
        """Returns which planetary boundaries are respected/violated"""
    
    def calculate_circularity(self, material_flows) -> float:
        """Ratio of recycled/reused materials to virgin inputs"""
    
    def calculate_distributiveness(self, financial_flows) -> float:
        """Gini coefficient or similar inequality metric"""
```

**Success Criterion:** Model flagged if it violates constraints (e.g., "Carbon budget exceeded in year 7").

### Phase 5: Advanced Composition & Optimization (Weeks 17-24)

**Add:** 
- Multi-scale modeling (local → regional → global)
- Policy intervention testing ("What if we add carbon tax?")
- Optimization ("Maximize circularity subject to financial viability")
- Scenario exploration ("Compare three governance structures")

---

## Critical Success Factors

### 1. Maintain Minsky Core Integrity
**Never modify:** Minsky's .mky parser, solver, or Godley table validation logic.

**Always validate:** Generated .mky files pass Minsky's internal checks before user sees them.

**Failure mode:** Plugin generates invalid .mky → Minsky crashes → user loses trust.

**Detection:** Run Minsky validation on all generated files in test suite.

### 2. Explicit Unit Semantics
**The danger:** `Financial.investment = 1000` could mean $/month or $/year. Energy flows could be instantaneous (W) or cumulative (kWh).

**The discipline:** Every cross-capital link MUST specify:
```python
LinkDefinition(
    from_table="Financial",
    from_account="investment",
    from_unit="USD/month",
    to_table="Energy", 
    to_account="panel_acquisition",
    to_unit="Watts",
    conversion="USD/month ÷ (2.5 USD/Watt) = Watts/month"
)
```

**Failure mode:** User gets nonsensical results because units were implicitly assumed wrong.

**Detection:** Explicit unit tracking in metadata; validation checks dimensional analysis.

### 3. Composable Pattern Semantics
**The challenge:** Two patterns that work independently may not compose.

**Example:**
- Pattern A: "Credit creation" (banks lend to households)
- Pattern B: "Community ownership" (no external lending)
- Conflict: Can't compose without resolving who provides credit

**The solution:** Pattern metadata includes:
```yaml
pattern: credit_creation
  requires:
    - sectors: [bank, borrower]
    - relationship: "bank can create deposits"
  conflicts_with:
    - full_reserve_banking
    - barter_only
  compatible_with:
    - government_deficit
    - renewable_energy
```

**Failure mode:** User composes incompatible patterns → model is internally contradictory.

**Detection:** Composition validator checks compatibility matrix before generation.

### 4. Epistemically Honest About Limitations
**What the system CAN'T model:**
- Power dynamics, political economy
- Innovation, technological change (except as exogenous parameters)
- Trust, social capital formation
- Qualitative governance structures

**The discipline:** When user asks for these, system responds:
```
"I cannot model trust as a stock in Godley tables because trust is non-conserved 
and non-additive. However, I can:
1. Model financial consequences of trust (e.g., lower transaction costs)
2. Add qualitative annotations about governance in metadata
3. Flag where social dynamics are assumed but not modeled

Would you like me to proceed with these limitations?"
```

**Failure mode:** User thinks system models something it doesn't → misinterprets results.

---

## Validation Criteria by Phase

### Phase 1: Basic Generation
- [ ] 20 test prompts → 20 valid .mky files
- [ ] All files open in Minsky without error
- [ ] All files simulate for 10 time periods
- [ ] Pattern recognition achieves 90%+ accuracy on 50 test models
- [ ] LLM can explain economic meaning of generated flows

### Phase 2: Multi-Capital
- [ ] 10 dual-capital models (financial + one other)
- [ ] Cross-capital links maintain correct unit conversions
- [ ] Energy table results correlate with financial investments as expected
- [ ] Carbon accounting matches energy flows within 5% tolerance
- [ ] Material flow conservation holds (no mass appears/disappears)

### Phase 3: Pattern Composition  
- [ ] Pattern library contains 10+ validated patterns
- [ ] 20 composition tests (all valid compositions work, all invalid ones reject)
- [ ] User can describe model in terms of patterns, system generates correctly
- [ ] Pattern modifications propagate correctly through composition

### Phase 4: Regenerative Validation
- [ ] Doughnut boundary checks implemented for 8/9 planetary boundaries
- [ ] Social foundation checks for 10/12 needs
- [ ] Circularity metric matches manual calculation
- [ ] System correctly flags boundary violations in test scenarios

---

## Implementation Priorities

### Build This First (Week 1-2)
1. **Minimal .mky generator:** One Godley table, hardcoded structure
2. **LLM prompt → sector/flow extraction:** Parse user intent
3. **Accounting validator:** Check row balance, stock-flow consistency
4. **Test harness:** Automated validation that files work in Minsky

### Build This Second (Week 3-4)
1. **Pattern recognition:** Extract patterns from example .mky files
2. **Canvas manipulation API:** Add sectors and flows programmatically
3. **LLM explanation:** Generate natural language descriptions of models
4. **Basic metadata structure:** .mky.meta format definition

### Defer Until Proven (After Week 4)
- Multi-capital tables
- Complex pattern composition
- Frontend UI modifications
- Optimization algorithms

---

## Failure Modes & Mitigations

| Failure Mode | Detection | Mitigation |
|--------------|-----------|------------|
| Invalid .mky syntax | Minsky parse error | Schema validation before writing file |
| Accounting imbalance | Row sum ≠ 0 | Automated balance checks in generator |
| Unit confusion | Nonsensical results | Explicit unit tracking + dimensional analysis |
| Pattern incompatibility | Contradictory model | Composition validator with conflict detection |
| Overpromising capability | User expects social dynamics modeling | Explicit limitations in LLM system prompt |
| Brittleness to Minsky updates | Plugin breaks on new version | Minimal surface area; test against multiple versions |

---

## Development Workflow

### For Each Feature
1. **Specify:** What does success look like? (Validation criteria)
2. **Prototype:** Minimal implementation (hardcode if necessary)
3. **Validate:** Run against test suite
4. **Generalize:** Replace hardcoding with LLM/generation logic
5. **Document:** Update pattern library and examples

### Testing Philosophy
- **Unit tests:** Individual functions (generate_godley_table, validate_balance)
- **Integration tests:** Full prompt → .mky → Minsky simulation
- **Validation tests:** Economic semantics (does model mean what user intended?)
- **Regression tests:** Existing patterns still work after changes

### The Meta-Discipline
Every time you're unsure whether something should be hardcoded or LLM-generated:

**Hardcode if:** It's a universal economic law (e.g., accounting balance)

**LLM-generate if:** It depends on user intent (e.g., which sectors to include)

**Metadata if:** It's semantic interpretation not simulation (e.g., "this is a cooperative")

---

## Why This Approach Reaches 96th Percentile

### Structural Elegance
Uses Minsky's existing solver for what it's mathematically designed to do (conserved quantities), rather than fighting it or reimplementing it.

### Epistemically Grounded
Explicit about what can and cannot be modeled. Distinguishes mathematical structure (Godley tables) from semantic interpretation (patterns).

### Pragmatically Bounded
MVP achieves genuine value (generate valid models) without attempting the full vision immediately. Each phase builds on validated foundation.

### Theoretically Informed
Draws on Beige (patterns), Hedges (composition), Raworth (constraints) without requiring full categorical semantics implementation.

### Compositionally Sound
Pattern library designed for combination, not just catalog. Composition rules prevent invalid combinations.

### Validation-Driven
Every capability has explicit success criteria. Failure modes identified and mitigated upfront.

---

## Final Note: The Long Game

This plugin becomes the semantic intelligence layer for economic modeling. As it matures:

- **Research tool:** Economists model novel regenerative structures
- **Policy analysis:** Test interventions in multi-capital context  
- **Educational platform:** Students learn economics through model building
- **Design tool:** Organizations prototype regenerative business models

The vision is accessible, rigorous, multi-capital economic modeling through natural language. The path is incremental validation of composable patterns.

Start with: "Can LLM generate a valid two-sector model?" 

End with: "Can we design a regenerative bioregional economy?"

Build the bridge one validated step at a time.

---

## Appendix: Key Concepts Reference

**Stock-Flow Consistency (SFC):** Every flow between sectors must be accounted for in balance sheets. No financial assets/liabilities appear or disappear.

**Godley Table:** Double-entry bookkeeping table where rows are flows, columns are accounts, enforcing `Assets - Liabilities - Equity = 0`.

**Multi-Capital:** Modeling financial, natural, social, and manufactured capitals simultaneously with feedback between them.

**Pattern (Economic):** Reusable structure describing a recurring economic mechanism (e.g., credit creation, circular material flow).

**Regenerative:** Economic activity that restores rather than depletes natural and social capitals. Operates within planetary boundaries and social foundations (Doughnut).

**Conservation Law:** Physical/mathematical principle that a quantity is neither created nor destroyed, only transformed. Financial flows conserve money; material flows conserve mass; energy flows conserve energy.

**Categorical Cybernetics:** Mathematical framework for composing control systems using category theory. Provides formal semantics for pattern composition (aspirational, not required for MVP).
