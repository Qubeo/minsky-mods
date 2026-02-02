// API client for Minsky Dashboard

const API_BASE = 'http://localhost:3000';

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'API error');
  }
  return json.data as T;
}

export const api = {
  async getVersion(): Promise<string> {
    const { version } = await apiFetch<{ version: string }>('/api/version');
    return version;
  },

  async getState(): Promise<SimulationState> {
    return apiFetch<SimulationState>('/api/state');
  },

  async getVariables(): Promise<Variable[]> {
    return apiFetch<Variable[]>('/api/variables');
  },

  async loadModel(path: string): Promise<void> {
    await apiFetch('/api/model/load', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  },

  async reset(): Promise<number> {
    const { t } = await apiFetch<{ t: number }>('/api/sim/reset');
    return t;
  },

  async step(): Promise<number> {
    const { t } = await apiFetch<{ t: number }>('/api/sim/step');
    return t;
  },

  async run(steps: number, variables?: string[]): Promise<{ history: TimeSeriesPoint[]; finalT: number }> {
    return apiFetch('/api/sim/run', {
      method: 'POST',
      body: JSON.stringify({ steps, variables }),
    });
  },
};
