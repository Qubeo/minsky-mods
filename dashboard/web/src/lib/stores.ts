// Svelte stores for dashboard state

import { writable } from 'svelte/store';
import type { Variable, SimulationState, TimeSeriesPoint } from './api';

export const modelPath = writable<string>('');
export const modelLoaded = writable<boolean>(false);
export const variables = writable<Variable[]>([]);
export const simState = writable<SimulationState | null>(null);
export const history = writable<TimeSeriesPoint[]>([]);
export const selectedVariables = writable<string[]>([]);
export const apiError = writable<string | null>(null);
export const loading = writable<boolean>(false);
