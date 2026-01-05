# Minsky Project Analysis and Improvement Proposal

## 1. Project Overview
Minsky is a system dynamics modeling tool for economics, featuring a C++ simulation engine and a TypeScript/Angular/Electron frontend. It uses a Directed Acyclic Graph (DAG) for equation solving and Godley Tables for stock-flow consistent modeling.

### Architecture
- **Backend (C++):** Handles the core logic, numerical integration (Runge-Kutta), and data management. It exposes functionality via a REST API.
- **Frontend (TypeScript/Angular):** Provides the visual canvas, user interaction, and communicates with the backend.
- **Persistence:** Models are saved as `.mky` files, which are XML documents following `Schema3`.

## 2. Current AI Integration Status
The current AI model generation logic is located in [minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts).

**Workflow:**
1.  **Prompt Construction:** Builds a system prompt listing available operations.
2.  **LLM Call:** Sends the prompt to Gemini or Claude.
3.  **JSON Parsing:** Parses the LLM's JSON response.
4.  **Manual XML Generation:**  Constructs a `.mky` XML string via string concatenation ([generateMinskyXML](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#1524-1797) method).
5.  **Loading:** Saves the XML to a temporary file and loads it using `minsky.load()`.

**Critique:**
- **Brittle Implementation:** Manual string concatenation for XML generation is error-prone and hard to maintain.
- **Tight Coupling:** The logic is embedded directly in [CommandsManager](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#29-2001), mixing UI concerns with model generation.
- **Lack of Validation:** There is no intermediate validation step to ensure the generated model is semantically correct before loading.
- **Limited Scope:** Currently supports basic variables and operations but lacks robust support for Godley tables, groups, and complex wiring.

## 3. Proposed Improvements
The documentation ([docs/minsky-dsl-foundation.md](file:///home/qubeo/prog/minsky/docs/minsky-dsl-foundation.md)) proposes a robust "Four-Layer Architecture" which addresses these issues.

### Key Recommendations
1.  **Implement the Minsky Model DSL:**
    - Create a TypeScript abstraction layer (`MinskyModel`, `VariableSpec`, `WireSpec`) to represent models declaratively.
    - This decouples the AI output from the specific serialization format (XML).

2.  **Develop a Model Builder:**
    - Implement `MinskyModelBuilder` to translate the DSL into:
        - **Schema3 XML:** For saving/loading files (replacing the manual string concatenation).
        - **Canvas API Calls:** For real-time visual updates (optional but planned).

3.  **Add Validation Layer:**
    - Implement validators for stock-flow consistency, unit compatibility, and graph integrity *before* the model reaches the C++ backend.

4.  **Refactor [CommandsManager](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#29-2001):**
    - Extract the AI logic into a dedicated service (`AiModelService`).
    - Use the Builder pattern to generate the XML.

## 4. Way Forward (Implementation Plan)
I propose to execute **Phase 1** of the roadmap defined in [minsky-dsl-foundation.md](file:///home/qubeo/prog/minsky/docs/minsky-dsl-foundation.md).

**Phase 1 Objectives:**
- Define the DSL TypeScript interfaces.
- Implement the `MinskyModelBuilder` with XML generation capabilities (replacing the fragile code in [CommandsManager](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#29-2001)).
- Refactor [CommandsManager](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#29-2001) to use the new DSL and Builder.

This will provide a solid foundation for the more advanced features (Godley tables, multi-capital modeling) envisioned in the "Regenerative Economics Plugin".
