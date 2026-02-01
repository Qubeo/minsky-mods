// Export Angular modules and components
export { DashboardModule } from './lib/dashboard.module';
export { DashboardComponent } from './lib/dashboard.component';

// DO NOT export ipc-handlers here!
// They contain Node.js modules and will break browser bundle
