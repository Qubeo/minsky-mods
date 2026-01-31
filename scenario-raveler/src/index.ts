/**
 * @module scenario-raveler
 * @description Ravel scenario infrastructure from CSV (Ravel-based architecture)
 */

// Frontend exports (Angular modules and components)
export * from './lib/scenario-raveler.service';
export * from './lib/scenario-raveler.component';
export * from './lib/scenario-wiring.service';
export * from './lib/scenario-wiring.component';
export * from './lib/dialogs/missing-variables-dialog.component';
export * from './lib/dialogs/preview-dialog.component';
export * from './lib/models/scenario-data.model';

export { ScenarioRavelerModule } from './lib/scenario-raveler.module';
export { ScenarioWiringModule } from './lib/scenario-wiring.module';

// Backend exports are NOT exported from index - they're loaded directly in backend code
