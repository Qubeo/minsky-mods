Minsky-to-LLM Export Script: Requirements Brief
Objective: A Python script that transforms Minsky .mky files (XML) into a JSON format optimized for LLM-assisted analysis. The output should be semantically rich, token-efficient, and diagnostically transparent—exposing the model's structure and potential issues rather than silently fixing them.

Source Format
Minsky .mky files are XML containing:

Variables: type ∈ {Variable:stock, Variable:flow, Variable:parameter, Variable:integral}, with name, init, x, y
Operations: type = Operation:{add|multiply|divide|subtract|lt|le|gt|ge|max|min|log|exp|pow|time|...}
Wires: Connect items by index (from, to)
Godley Tables: Stock-flow accounting matrices with stockVars, flowVars, and sign assignments
Groups: Named containers with nested items (may indicate logical modules)


Design Principles

Fidelity over cleanliness: Preserve what exists. Don't infer, deduplicate, or "fix."
Expose anomalies: If the same variable name appears multiple times, list all instances with their IDs and positions. Let the analyst decide if it's intentional.
Separate structure from content: Distinguish topology (what connects to what) from values (parameters, initial conditions).
Spatial metadata is signal: Include coordinates or derived clustering—the visual layout reflects the modeler's mental model.
Graceful degradation: If formula reconstruction fails, include the raw operation chain. Ugly truth beats silent omission.
Token economy: Use columnar encoding (schema + row arrays) for high-volume homogeneous data (variables, operations, wires). Reserve verbose object notation for heterogeneous structures (Godley tables, diagnostics).


Output Schema (Indicative)
json{
  "metadata": {
    "source": "model.mky",
    "exported": "ISO-timestamp",
    "counts": {"variables": N, "operations": M, "wires": K, "godley_tables": G, "groups": P}
  },

  "godley_tables": [
    {
      "id": "GodleyIcon123",
      "name": "...",  // if named
      "stocks": ["A", "B", "C"],
      "flows": {
        "FlowX": {"A": "+", "B": "-"},
        "FlowY": {"B": "+", "C": "-"}
      },
      "raw_matrix": [[...]]  // preserve original for verification
    }
  ],

  "variables": [
    {
      "id": "Var42",
      "type": "stock",
      "name": "ActiveInvestors",
      "initial_value": 2,
      "position": {"x": 1234, "y": 567},
      "defined_by": "Godley:GodleyIcon123",  // or "integral" or "equation"
      "wired_to": ["Op88", "Op92"],
      "wired_from": ["Op45"]
    }
    // ALL instances, including duplicates
  ],

  "operations": [
    {
      "id": "Op88",
      "type": "multiply",
      "inputs": ["Var42", "Var87"],
      "outputs": ["Var103"],
      "position": {"x": ..., "y": ...}
    }
  ],

  "equations": {
    "Var103": {
      "reconstructed": "ActiveInvestors * GrowthRate",  // best-effort human-readable
      "raw_chain": "Op88(Var42, Var87)",  // fallback
      "reconstruction_status": "success" | "partial" | "failed"
    }
  },

  "groups": [
    {
      "id": "Group5",
      "name": "Demand Side",
      "contains": ["Var14", "Var17", "Op15", ...],
      "bounding_box": {"x_min": ..., "y_min": ..., "x_max": ..., "y_max": ...}
    }
  ],

  "diagnostics": {
    "duplicate_names": [
      {"name": "SMEacquisition", "instances": ["Var792", "Var802", "Var811"], "positions": [...]}
    ],
    "orphan_nodes": ["Var999"],  // no wires in or out
    "unnamed_variables": ["Var123", "Var456"],
    "godley_inconsistencies": [...]  // e.g., flow appears in multiple tables with different signs
  },

  "spatial_clusters": [
    // Optional: algorithmically derived groupings based on x,y proximity
    {"centroid": {"x": 5000, "y": 2000}, "members": ["Var1", "Var2", "Op3"], "suggested_label": null}
  ]
}

Key Implementation Notes
Godley Tables: Parse the actual accounting matrix from XML. Preserve raw matrix alongside structured interpretation. Flag any flow that appears in multiple tables or with inconsistent signs.
Formula Reconstruction: Traverse operation graph backward from each flow/stock. Serialize to infix notation respecting operator precedence. Mark reconstruction confidence. If a cycle is encountered (valid for feedback), note it.
Duplicate Detection: Do NOT merge. List all instances in diagnostics.duplicate_names with IDs and positions. The analyst needs this visibility.
Spatial Data: Include raw coordinates. Optionally run simple clustering (e.g., k-means or DBSCAN on positions) to suggest implicit groupings—but flag these as inferred, not authoritative.
Wiring: Preserve full graph. Each variable/operation lists wired_to and wired_from by ID.

CLI Interface
bashpython minsky_export.py input.mky -o output.json [options]

Options:
  --include-spatial-clusters   Run position-based clustering
  --omit-positions            Strip x,y coordinates (smaller output)
  --raw-only                  Skip equation reconstruction (faster)
  --verbose                   Log parsing decisions and warnings

Validation
After export, verify:

 Variable count matches source
 All Godley table stocks/flows are resolvable to variable entries
 Wire graph has no dangling references
 Diagnostics section is populated (even if empty arrays)
