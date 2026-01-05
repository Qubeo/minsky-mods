# Economic Pattern Library

**Version:** 0.1 (Initial Seed)
**Date:** 2025-12-01

> [!NOTE]
> **Status: Seed Library**
> This document represents an **initial seed** of economic patterns. It is not exhaustive. The universe of socio-economic coordination patterns is vast. This library serves as a starting point to demonstrate the EPL structure and provide a vocabulary for common structures found in Minsky models.
>
> **Goal:** To grow this library organically as new patterns are identified by users and AI agents.

This library defines core economic patterns using the Economic Pattern Language (EPL). These patterns serve as the "vocabulary" for AI agents to analyze Minsky models.

## 1. Fundamental Accounting Patterns

### 1.1. Double Entry Accounting (Godley Table)
*   **ID:** `p_double_entry`
*   **Framework:** SFC (Stock-Flow Consistent)
*   **Description:** A system where every flow comes from one sector and goes to another, ensuring that the sum of all flows is zero. In Minsky, this is explicitly represented by the Godley Table.
*   **Signature:**
    *   `requiredComponents`: ["GodleyTable"]
    *   `topology`: { "hasStockFlowConsistency": true }
*   **Roles:**
    *   `sector_column`: "A column representing an institutional sector (e.g., Households, Firms)"
    *   `transaction_row`: "A row representing a financial flow (e.g., Consumption, Wages)"
*   **Dynamics:**
    *   `accounting_identity`: "Sum of columns must equal zero (Budget Constraints). Sum of rows must equal zero (Flow Consistency)."

### 1.2. Stock-Flow Accumulation
*   **ID:** `p_stock_flow_accum`
*   **Framework:** General / System Dynamics
*   **Description:** The fundamental dynamic where a Flow integrates into a Stock over time.
*   **Signature:**
    *   `requiredComponents`: ["Stock", "Flow", "Wire"]
    *   `topology`: { "connection": "Flow -> Stock (Integration)" }
*   **Roles:**
    *   `stock`: "The accumulation variable (e.g., Capital, Debt)"
    *   `inflow`: "Rate of addition"
    *   `outflow`: "Rate of depletion"

## 2. Macroeconomic Dynamics

### 2.1. Goodwin Cycle (Class Struggle)
*   **ID:** `p_goodwin_cycle`
*   **Framework:** Classical / Marxian
*   **Description:** A predator-prey cycle between Employment (prey) and Wage Share (predator). High employment leads to high wages, which squeezes profits, reducing investment and employment, which then lowers wages, restoring profits.
*   **Signature:**
    *   `requiredComponents`: ["Stock", "Flow"]
    *   `topology`: { "hasFeedbackLoop": true }
*   **Roles:**
    *   `employment_rate`: "Proxy for prey population"
    *   `wage_share`: "Proxy for predator population"
    *   `phillips_curve`: "Function linking employment to wage growth"
*   **Dynamics:**
    *   `oscillation`: "Counter-clockwise cycle in Employment-Wage space."

### 2.2. Keynesian Multiplier
*   **ID:** `p_keynesian_multiplier`
*   **Framework:** Post-Keynesian
*   **Description:** An autonomous injection of spending (Investment/Gov) leads to a larger increase in total Income due to induced Consumption.
*   **Signature:**
    *   `requiredComponents`: ["Flow", "Parameter"]
    *   `topology`: { "hasFeedbackLoop": true }
*   **Roles:**
    *   `autonomous_spend`: "Investment or Government spending"
    *   `propensity_consume`: "Parameter (0 < alpha < 1)"
    *   `total_income`: "Y = C + I"
*   **Dynamics:**
    *   `reinforcing_loop`: "Income -> Consumption -> Income" (damped by savings leakage)

## 3. Financial Instability Patterns (Minskyan)

### 3.1. Ponzi Finance
*   **ID:** `p_ponzi_finance`
*   **Framework:** Financial Instability Hypothesis
*   **Description:** A financial position where cash flows from operations are insufficient to cover either principal or interest payments. Debt is serviced by issuing new debt.
*   **Signature:**
    *   `requiredComponents`: ["Stock", "Flow"]
*   **Roles:**
    *   `operating_income`: "Cash flow from assets"
    *   `debt_service`: "Interest + Principal payments"
    *   `debt_stock`: "Total liabilities"
*   **Dynamics:**
    *   `explosive_growth`: "Debt grows exponentially as interest is capitalized."

### 3.2. Debt-Deflation Spiral
*   **ID:** `p_debt_deflation`
*   **Framework:** Fisher / Minsky
*   **Description:** A reinforcing loop where asset liquidation to pay off debt lowers asset prices, increasing the real burden of remaining debt, leading to more liquidation.
*   **Signature:**
    *   `requiredComponents`: ["Stock", "Flow", "Variable"]
    *   `topology`: { "hasFeedbackLoop": true }
*   **Roles:**
    *   `debt_level`: "Nominal debt"
    *   `asset_price`: "Market value of collateral"
    *   `distress_selling`: "Flow of asset sales"
*   **Dynamics:**
    *   `collapse`: "Asset prices crash while real debt burden rises."

## 4. Market Diffusion Patterns (Nuance Example)

### 4.1. General Diffusion (`p_diffusion`)
*   **ID:** `p_diffusion`
*   **Framework:** System Dynamics / Marketing
*   **Description:** The process by which an innovation is communicated through certain channels over time among the members of a social system.
*   **Signature:**
    *   `requiredComponents`: ["Stock", "Flow"]
    *   `topology`: { "connection": "Potential Adopters -> Adoption Flow -> Adopters" }
*   **Roles:**
    *   `potential_adopters`: "Stock of people who haven't bought yet"
    *   `adopters`: "Stock of people who have bought"
    *   `adoption_rate`: "Flow moving people from Potential to Adopters"

### 4.2. Bass Diffusion (`p_bass_diffusion`)
*   **ID:** `p_bass_diffusion`
*   **Extends:** `p_diffusion`
*   **Description:** Diffusion driven by two distinct forces: Innovation (external influence) and Imitation (internal social contagion).
*   **Differentiation:** Look for the Adoption Rate equation containing two terms: `p * Potential` (Innovation) and `q * Potential * (Adopters/Total)` (Imitation).
*   **Roles:**
    *   `coefficient_innovation`: "Parameter p"
    *   `coefficient_imitation`: "Parameter q"

### 4.3. Sterman Diffusion (`p_sterman_diffusion`)
*   **ID:** `p_sterman_diffusion`
*   **Extends:** `p_bass_diffusion`
*   **Description:** Adds supply chain constraints and capacity delays to the standard Bass model. Adoption is limited not just by demand, but by product availability.
*   **Differentiation:** Look for a "Supply Line" stock, "Capacity" constraints, or "Order Fulfillment Ratio" affecting the Adoption Rate.
*   **Roles:**
    *   `supply_line`: "Stock of orders placed but not filled"
    *   `capacity`: "Max production rate"
    *   `fulfillment_ratio`: "Effect of shortages on adoption"
