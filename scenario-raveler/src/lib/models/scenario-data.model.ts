/** Rich parameter definition from SST CSV */
export interface ParameterInfo {
    name: string;
    type: 'parameter' | 'constant' | 'flow';
    units?: string;
    description?: string;
    init?: number | string;
    scenarioValues: Map<string, number | null>; // scenario name → value
}

/** Parsed scenario data from CSV */
export interface ScenarioData {
    parameters: ParameterInfo[];
    scenarioNames: string[];
}

// Legacy interfaces (kept for compatibility)
export interface ScenarioColumn {
    name: string;
    values: (number | null)[];
}

export interface ParameterMapping {
    csvName: string;
    modelName: string;
    valueId: string;
    currentValue: string;
    newValue: number;
    matched: boolean;
    units?: string;
    description?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    missingVariables: string[];
    mappings: ParameterMapping[];
}
