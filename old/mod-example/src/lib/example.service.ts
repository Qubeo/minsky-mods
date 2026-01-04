/**
 * Example Service
 *
 * Demonstrates:
 * - Injectable service pattern
 * - Accessing ElectronService
 * - Calling backend methods
 * - Event communication
 */

import { Injectable } from '@angular/core';

// NOTE: In a real mod, these imports would work after setting up tsconfig paths
// For now, this is a template showing the pattern
//
// import { ElectronService } from '@minsky/core';
// import { CommunicationService } from '@minsky/core';

@Injectable({ providedIn: 'root' })
export class ExampleService {
  // In a real implementation, inject services:
  // constructor(
  //   private electron: ElectronService,
  //   private communication: CommunicationService
  // ) {}

  constructor() {
    console.log('ExampleService initialized');
  }

  /**
   * Simple greeting method
   */
  greet(name: string): void {
    console.log(`Hello from ExampleService, ${name}!`);
  }

  /**
   * Example: Access Minsky backend
   *
   * async getCanvasInfo(): Promise<any> {
   *   // Access the C++ backend via proxy
   *   const canvas = this.electron.minsky.canvas;
   *   const width = await canvas.width();
   *   const height = await canvas.height();
   *
   *   return { width, height };
   * }
   */

  /**
   * Example: Send events
   *
   * notifyUser(message: string): void {
   *   this.communication.sendEvent({
   *     event: 'CUSTOM_NOTIFICATION',
   *     payload: { message }
   *   });
   * }
   */

  /**
   * Example: Listen to events
   *
   * ngOnInit() {
   *   this.communication.getBackEndMessages()
   *     .pipe(takeUntil(this.destroy$))
   *     .subscribe(msg => {
   *       if (msg.event === 'SIMULATION_STEP') {
   *         this.onSimulationStep(msg.payload);
   *       }
   *     });
   * }
   */
}
