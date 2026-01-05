# Handoff Instructions: Minsky DSL & AI Features

## Project Overview
The goal is to enhance Minsky's AI capabilities by implementing a robust, AI-readable Domain-Specific Language (DSL) and an "Economic Pattern Language" (EPL). This enables LLMs to reason about economic structures and allows for features like "Analyze Model" and "Generate Model" with high fidelity.

## Current Status
**Completed:**
1.  **DSL Implementation**:
    *   Defined types: [libs/shared/src/lib/dsl/types.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/types.ts)
    *   Implemented Generator (DSL -> XML): [libs/shared/src/lib/dsl/schema3/generator.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/generator.ts)
    *   Implemented Parser (XML -> DSL): [libs/shared/src/lib/dsl/schema3/parser.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/parser.ts)
    *   **Tier 1 Optimization**: Implemented optional wire ports to reduce JSON size.
2.  **Economic Pattern Language (EPL)**:
    *   Specification: [docs/economic_pattern_language_spec.md](file:///home/qubeo/prog/minsky/docs/economic_pattern_language_spec.md)
    *   Seed Library: [docs/economic_pattern_library.md](file:///home/qubeo/prog/minsky/docs/economic_pattern_library.md/home/qubeo/prog/minsky/docs/economic_pattern_library.md)
    *   System Prompt: [docs/pattern_recognition_prompt.md](file:///home/qubeo/prog/minsky/docs/pattern_recognition_prompt.md)
3.  **Features**:
    *   **Export to DSL**: Implemented in [CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts).
    *   **Import from DSL**: Implemented and debugged in [CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts).
    *   **Plotting Fix**: Updated [Schema3Generator](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/generator.ts#6-416) to include autoscaling parameters (`NaN` bounds) and implicit wiring for plots.

**Pending / In Progress:**
1.  **Analyze Model**: The `analyzeModel` function in [CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts) needs to be implemented.
2.  **IPC Handler**: The `ai-analyze-model` handler in [electron.events.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/events/electron.events.ts) is currently commented out.

## Critical Files
*   [libs/shared/src/lib/dsl/types.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/types.ts): DSL definitions.
*   [libs/shared/src/lib/dsl/schema3/generator.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/generator.ts): XML generation logic.
*   [libs/shared/src/lib/dsl/schema3/parser.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/libs/shared/src/lib/dsl/schema3/parser.ts): XML parsing logic.
*   [apps/minsky-electron/src/app/managers/CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts): Main logic for Import/Export and AI commands.
*   [docs/pattern_recognition_prompt.md](file:///home/qubeo/prog/minsky/docs/pattern_recognition_prompt.md): The prompt used for analysis.

## Immediate Next Steps for New Thread

1.  **Verify Plotting Fix**:
    *   The user was experiencing issues with graphs not showing lines.
    *   I added `<xmin>NaN</xmin>`, `<xmax>NaN</xmax>`, etc., to `Schema3Generator.ts`.
    *   **Action**: Ask the user to confirm if the graphs are now visible after importing a DSL model.

2.  **Implement `analyzeModel`**:
    *   **Location**: [apps/minsky-electron/src/app/managers/CommandsManager.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts)
    *   **Logic**:
        1.  Get current XML: `minsky.canvas.getMinskyXML()` (or similar).
        2.  Parse to DSL: `const dsl = new Schema3Parser().parse(xml)`.
        3.  Read System Prompt: [docs/pattern_recognition_prompt.md](file:///home/qubeo/prog/minsky/docs/pattern_recognition_prompt.md).
        4.  Construct User Prompt: Combine System Prompt + DSL JSON.
        5.  Call LLM: `this.callGeminiAPI(prompt)` (or Anthropic).
        6.  Display Result: Show the analysis to the user.

3.  **Enable IPC Handler**:
    *   **Location**: [apps/minsky-electron/src/app/events/electron.events.ts](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/events/electron.events.ts)
    *   **Action**: Uncomment the `ai-analyze-model` handler and ensure it calls `CommandsManager.analyzeModel()`.

## Known Issues / Context
*   **Import from DSL**: Was failing silently, then with a `TypeError`. Fixed by re-adding the missing [importModelFromDSL](file:///home/qubeo/prog/minsky/minsky-src/gui-js/apps/minsky-electron/src/app/managers/CommandsManager.ts#1792-1847) method and using `minsky.load()` instead of `this.load()`.
*   **Context Window**: The previous thread was long, hence this handoff.
