/**
 * @module scenario-grower
 * @description Grow scenario infrastructure from CSV (tensor-based architecture)
 */

export * from './lib/scenario-grower.service';
export * from './lib/scenario-grower.component';
export * from './lib/scenario-wiring.service';
export * from './lib/scenario-wiring.component';
export * from './lib/dialogs/missing-variables-dialog.component';
export * from './lib/dialogs/preview-dialog.component';
export * from './lib/models/scenario-data.model';

export { ScenarioGrowerModule } from './lib/scenario-grower.module';
export { ScenarioWiringModule } from './lib/scenario-wiring.module';
export { ipcHandlers } from './lib/ipc-handlers';
