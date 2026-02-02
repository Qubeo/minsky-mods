// Shared types for Minsky Dashboard API

export interface Variable {
  name: string;        // Full key for API lookups (e.g., ":Investment")
  displayName: string; // Human-readable name (e.g., "Investment")
  value: number;
  type: 'flow' | 'stock' | 'parameter' | 'constant';
}

export interface SimulationState {
  t: number;
  running: boolean;
  stepMin: number;
  stepMax: number;
  nSteps: number;
}

export interface TimeSeriesPoint {
  t: number;
  [variable: string]: number;
}

export interface ModelInfo {
  path: string;
  loaded: boolean;
  variables: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
