/**
 * Minsky Dashboard API Types
 *
 * Re-exports from @minsky-dev/shared-types for backwards compatibility.
 * New code should import directly from @minsky-dev/shared-types.
 */

// Re-export simulation types
export {
  type VariableType,
  type Variable,
  type SimulationState,
  type TimeSeriesPoint,
  type ModelInfo,
} from '@minsky-dev/shared-types/simulation';

// Re-export API types
export {
  type ApiResponse,
} from '@minsky-dev/shared-types/api';
