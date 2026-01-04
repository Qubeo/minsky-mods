/**
 * Example Component
 *
 * Demonstrates:
 * - Standalone component pattern
 * - Service injection
 * - Basic template
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExampleService } from './example.service';

@Component({
  selector: 'minsky-example',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="example-mod">
      <h3>Example Mod</h3>
      <p>This is a simple example component.</p>
      <button (click)="onButtonClick()">Test Service</button>
      <div *ngIf="message" class="message">
        {{ message }}
      </div>
    </div>
  `,
  styles: [`
    .example-mod {
      padding: 20px;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      margin: 10px;
    }

    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    button:hover {
      background-color: #45a049;
    }

    .message {
      margin-top: 10px;
      padding: 10px;
      background-color: #f0f0f0;
      border-radius: 4px;
    }
  `]
})
export class ExampleComponent {
  message: string = '';

  constructor(private exampleService: ExampleService) {}

  onButtonClick(): void {
    this.exampleService.greet('Button Click');
    this.message = 'Service called! Check console.';

    setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  /**
   * Example: Lifecycle hooks
   *
   * ngOnInit() {
   *   // Initialize component
   *   this.loadData();
   * }
   *
   * ngOnDestroy() {
   *   // Cleanup subscriptions
   *   this.destroy$.next();
   *   this.destroy$.complete();
   * }
   */

  /**
   * Example: Backend integration
   *
   * async loadData() {
   *   try {
   *     const data = await this.exampleService.getCanvasInfo();
   *     this.message = `Canvas: ${data.width}x${data.height}`;
   *   } catch (error) {
   *     console.error('Failed to load data:', error);
   *   }
   * }
   */
}
