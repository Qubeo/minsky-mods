import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScenarioWiringService, TensorMetadata } from './scenario-wiring.service';
import { ScenarioMkyGeneratorService } from './scenario-mky-generator.service';
import { ElectronService } from '@minsky/core';

@Component({
    selector: 'minsky-scenario-wiring',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="scenario-wiring">
      <h2>Wire Scenario Parameters</h2>

      <!-- Step 1: Enter tensor name -->
      <div class="step" *ngIf="!metadata && !loading">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tensor Variable Name</mat-label>
          <input matInput [(ngModel)]="tensorName" placeholder="e.g., ScenarioTensor">
        </mat-form-field>
        <button mat-raised-button color="primary"
                [disabled]="!tensorName.trim()"
                (click)="detectStructure()">
          Detect Structure
        </button>
      </div>

      <!-- Loading -->
      <div class="step" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Reading tensor structure...</p>
      </div>

      <!-- Step 2: Show detected structure -->
      <div class="step" *ngIf="metadata && !wiring">
        <h3>Detected Structure for "{{ tensorName }}"</h3>

        <div class="info-section">
          <p><strong>Parameters ({{ metadata.numParams }}):</strong></p>
          <div class="chip-list">
            <span class="chip" *ngFor="let p of metadata.paramNames">{{ p }}</span>
          </div>

          <p><strong>Rows ({{ metadata.numScenarios }}):</strong></p>
          <div class="chip-list">
            <span class="chip" *ngFor="let s of metadata.scenarioNames">{{ s }}</span>
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Number of Scenario Rows (from bottom)</mat-label>
          <input matInput type="number" [(ngModel)]="numScenarioRows" min="1" [max]="metadata.numScenarios">
          <mat-hint>Metadata rows (type, units, etc.) will be excluded</mat-hint>
        </mat-form-field>

        <div class="actions">
          <button mat-button (click)="reset()">Cancel</button>
          <button mat-raised-button color="primary" (click)="wireParameters()">
            Wire Parameters
          </button>
        </div>
      </div>

      <!-- Wiring Progress -->
      <div class="step" *ngIf="wiring">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Creating infrastructure...</p>
      </div>

      <div class="error" *ngIf="error">{{ error }}</div>
      <div class="success" *ngIf="success">{{ success }}</div>
    </div>
  `,
    styles: [`
    .scenario-wiring { padding: 20px; max-width: 600px; }
    .step { margin: 20px 0; }
    h3 { margin-bottom: 15px; }
    .info-section { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 15px 0; }
    .chip-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 16px; }
    .chip { background: #e3f2fd; color: #1976d2; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-family: monospace; }
    .full-width { width: 100%; margin: 10px 0; }
    .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .error { color: #f44336; padding: 10px; background: #ffebee; border-radius: 4px; margin-top: 10px; }
    .success { color: #4CAF50; padding: 10px; background: #e8f5e9; border-radius: 4px; margin-top: 10px; }
    mat-spinner { margin: 10px auto; display: block; }
  `]
})
export class ScenarioWiringComponent {
    tensorName = '';
    metadata: TensorMetadata | null = null;
    numScenarioRows = 3;
    loading = false;
    wiring = false;
    error = '';
    success = '';

    constructor(
        private wiringService: ScenarioWiringService,
        private mkyGenerator: ScenarioMkyGeneratorService,
        private electron: ElectronService
    ) {}

    async detectStructure(): Promise<void> {
        this.error = '';
        this.loading = true;

        try {
            const meta = await this.wiringService.readTensorStructure(this.tensorName);
            if (!meta) {
                this.error = `Could not read tensor "${this.tensorName}". Check name and ensure data is loaded.`;
                return;
            }
            this.metadata = meta;
            // Default: assume last 3 rows are scenarios (or all if fewer)
            this.numScenarioRows = Math.min(3, meta.numScenarios);
        } catch (e: any) {
            this.error = e.message || 'Failed to detect structure';
        } finally {
            this.loading = false;
        }
    }

    async wireParameters(): Promise<void> {
        if (!this.metadata) return;
        this.error = '';
        this.wiring = true;

        try {
            // Extract scenario names (last N rows)
            const scenarios = this.metadata.scenarioNames.slice(-this.numScenarioRows);

            // 1. Generate the XML content using the generator service
            const mkyXml = this.mkyGenerator.generateMinskyXML(
                this.tensorName,
                this.metadata.paramNames,
                scenarios,
                this.metadata.paramAxisName,
                this.metadata.scenarioAxisName,
                this.metadata.numScenarios // Total attribute count
            );

            // 2. Write to temporary file via IPC and load it
            const tempFile = await this.electron.invoke(
                'write-temp-file',
                mkyXml,
                `scenario-wiring-${Date.now()}.mky`
            );

            try {
                // Load the group from the temp file
                await this.electron.minsky.insertGroupFromFile(tempFile);
                
                this.success = `Created ${this.metadata.paramNames.length} parameter variables (type: flow) with ${scenarios.length} scenarios`;
                setTimeout(() => this.reset(), 3000);
            } finally {
                // Clean up temp file
                await this.electron.invoke('delete-file', tempFile);
            }
        } catch (e: any) {
            this.error = e.message || 'Wiring failed';
            console.error('Wiring error:', e);
        } finally {
            this.wiring = false;
        }
    }

    reset(): void {
        this.metadata = null;
        this.error = '';
        this.success = '';
    }
}
