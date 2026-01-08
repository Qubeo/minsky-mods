import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ElectronService } from '@minsky/core';
import { CsvParser } from './utils/csv-parser.util';
import { ScenarioTensorBuilderService } from './scenario-tensor-builder.service';
import { ScenarioData } from './models/scenario-data.model';

@Component({
    selector: 'minsky-scenario-grower',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatTableModule, MatProgressSpinnerModule],
    template: `
    <div class="scenario-grower">
      <h2>Grow Scenario Infrastructure</h2>

      <!-- Step 1: File Selection -->
      <div class="step" *ngIf="!scenarioData">
        <p>Select a CSV file with scenario parameters (format: name,type,units,description,init,scenario_cols...):</p>
        <button mat-raised-button color="primary" (click)="selectFile()" [disabled]="loading">
          Browse CSV File...
        </button>
      </div>

      <!-- Step 2: Preview & Grow -->
      <div class="step" *ngIf="scenarioData && !growing">
        <p class="file-path">File: {{ csvFilePath | slice:-50 }}</p>

        <h3>Parameters Summary</h3>
        <table mat-table [dataSource]="scenarioData.parameters" class="params-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell>Parameter</th>
            <td mat-cell *matCellDef="let element">{{ element.name }}</td>
          </ng-container>
          <ng-container matColumnDef="type">
            <th mat-header-cell>Type</th>
            <td mat-cell *matCellDef="let element">{{ element.type }}</td>
          </ng-container>
          <ng-container matColumnDef="scenarios">
            <th mat-header-cell>Scenarios</th>
            <td mat-cell *matCellDef="let element">{{ element.scenarioValues.size }}</td>
          </ng-container>
          <tr mat-header-row></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <p class="summary">{{ scenarioData.parameters.length }} parameters, {{ scenarioData.scenarioNames.length }} scenarios</p>

        <div class="actions">
          <button mat-button (click)="reset()">Change File</button>
          <button mat-raised-button color="primary" (click)="growInfrastructure()">
            Grow Infrastructure
          </button>
        </div>
      </div>

      <!-- Loading/Growing -->
      <div class="step" *ngIf="growing">
        <p>Growing scenario infrastructure...</p>
        <mat-spinner></mat-spinner>
      </div>

      <!-- Messages -->
      <div class="error" *ngIf="error">{{ error }}</div>
      <div class="success" *ngIf="success">{{ success }}</div>
    </div>
  `,
    styles: [`
    .scenario-grower { padding: 20px; max-width: 800px; }
    .step { margin: 20px 0; }
    .file-path { font-size: 12px; color: #666; margin-bottom: 10px; }
    .params-table { width: 100%; margin: 10px 0; font-size: 12px; }
    .summary { font-size: 12px; color: #666; margin: 10px 0; }
    .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .error { color: #f44336; padding: 10px; background: #ffebee; border-radius: 4px; margin-top: 10px; }
    .success { color: #4CAF50; padding: 10px; background: #e8f5e9; border-radius: 4px; margin-top: 10px; }
    mat-spinner { margin: 20px auto; }
  `]
})
export class ScenarioGrowerComponent {
    csvFilePath: string = '';
    scenarioData: ScenarioData | null = null;
    loading = false;
    growing = false;
    error = '';
    success = '';

    displayedColumns = ['name', 'type', 'scenarios'];

    constructor(
        private electron: ElectronService,
        private builder: ScenarioTensorBuilderService
    ) {}

    async selectFile(): Promise<void> {
        this.error = '';
        this.success = '';
        this.loading = true;

        try {
            const filePaths = await this.electron.openFileDialog({
                defaultPath: ':data',
                filters: [{ extensions: ['csv'], name: 'CSV Files' }],
                properties: ['openFile']
            });

            if (!filePaths) return;

            this.csvFilePath = typeof filePaths === 'string' ? filePaths : filePaths[0];
            const csvText = await this.electron.invoke('read-file-text', this.csvFilePath);
            this.scenarioData = CsvParser.parse(csvText);
        } catch (e: any) {
            this.error = e.message || 'Failed to load CSV';
        } finally {
            this.loading = false;
        }
    }

    async growInfrastructure(): Promise<void> {
        if (!this.scenarioData) return;
        this.error = '';
        this.success = '';
        this.growing = true;

        try {
            await this.builder.buildInfrastructure(this.scenarioData);
            this.success = `✓ Infrastructure created: ${this.scenarioData.parameters.length} parameters, ${this.scenarioData.scenarioNames.length} scenarios`;
            setTimeout(() => {
                this.reset();
            }, 2000);
        } catch (e: any) {
            this.error = e.message || 'Failed to create infrastructure';
        } finally {
            this.growing = false;
        }
    }

    reset(): void {
        this.csvFilePath = '';
        this.scenarioData = null;
        this.error = '';
        this.success = '';
    }
}
