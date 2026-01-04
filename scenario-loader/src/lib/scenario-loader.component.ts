import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ElectronService } from '@minsky/core';
import { ScenarioLoaderService } from './scenario-loader.service';
import { ScenarioData, ValidationResult, ParameterMapping } from './models/scenario-data.model';
import { MissingVariablesDialogComponent } from './dialogs/missing-variables-dialog.component';
import { PreviewDialogComponent } from './dialogs/preview-dialog.component';

@Component({
    selector: 'minsky-scenario-loader',
    standalone: true,
    imports: [
        CommonModule, FormsModule, MatFormFieldModule,
        MatSelectModule, MatButtonModule, MatDialogModule
    ],
    template: `
    <div class="scenario-loader">
      <h2>Load Scenario</h2>

      <!-- Step 1: File Selection -->
      <div class="step" *ngIf="!csvFilePath">
        <p>Select a CSV file containing parameter scenarios:</p>
        <button mat-raised-button color="primary" (click)="selectFile()">
          Browse CSV File...
        </button>
      </div>

      <!-- Step 2: Scenario Selection -->
      <div class="step" *ngIf="csvFilePath && scenarioData">
        <p class="file-path">File: {{ csvFilePath | slice:-40 }}</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Scenario</mat-label>
          <mat-select [(value)]="selectedScenario">
            <mat-option *ngFor="let s of scenarioData.scenarios" [value]="s.name">
              {{ s.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="actions">
          <button mat-button (click)="reset()">Change File</button>
          <button mat-raised-button color="primary" 
                  [disabled]="!selectedScenario"
                  (click)="loadScenario()">
            Load Scenario
          </button>
        </div>
      </div>

      <!-- Error Display -->
      <div class="error" *ngIf="error">{{ error }}</div>
      
      <!-- Success Message -->
      <div class="success" *ngIf="success">{{ success }}</div>
    </div>
  `,
    styles: [`
    .scenario-loader { padding: 20px; }
    .step { margin: 20px 0; }
    .full-width { width: 100%; }
    .file-path { font-size: 12px; color: #666; margin-bottom: 10px; }
    .actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
    .error { color: #f44336; margin-top: 10px; padding: 10px; background: #ffebee; border-radius: 4px; }
    .success { color: #4CAF50; margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 4px; }
  `]
})
export class ScenarioLoaderComponent implements OnInit {
    csvFilePath: string = '';
    scenarioData: ScenarioData | null = null;
    selectedScenario: string = '';
    error: string = '';
    success: string = '';

    constructor(
        private scenarioService: ScenarioLoaderService,
        private electronService: ElectronService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void { }

    async selectFile(): Promise<void> {
        this.error = '';
        this.success = '';

        try {
            const filePaths = await this.electronService.openFileDialog({
                defaultPath: ':data',
                filters: [{ extensions: ['csv'], name: 'CSV Files' }],
                properties: ['openFile']
            });

            if (!filePaths) return;

            this.csvFilePath = typeof filePaths === 'string' ? filePaths : filePaths[0];
            const csvText = await this.scenarioService.readCsvFile(this.csvFilePath);
            this.scenarioData = this.scenarioService.parseScenarioData(csvText);

            if (this.scenarioData.scenarios.length > 0) {
                this.selectedScenario = this.scenarioData.scenarios[0].name;
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to load CSV file';
        }
    }

    async loadScenario(): Promise<void> {
        if (!this.scenarioData || !this.selectedScenario) return;
        this.error = '';
        this.success = '';

        try {
            const validation = await this.scenarioService.validateScenario(
                this.scenarioData,
                this.selectedScenario
            );

            // Handle missing variables
            if (validation.missingVariables.length > 0) {
                const create = await this.showMissingDialog(validation.missingVariables);
                if (create) {
                    // Filter mappings to find the missing ones to pass to creation service
                    // Missing variables are those where 'matched' is false.
                    const missingMappings = validation.mappings.filter(m => !m.matched);
                    await this.scenarioService.createMissingVariables(missingMappings);

                    // Re-validate after creating
                    const revalidation = await this.scenarioService.validateScenario(
                        this.scenarioData,
                        this.selectedScenario
                    );
                    validation.mappings = revalidation.mappings;
                }
            }

            const matchedMappings = validation.mappings.filter(m => m.matched);
            if (matchedMappings.length === 0) {
                this.error = 'No variables matched. Please check variable names.';
                return;
            }

            // Show preview
            const apply = await this.showPreviewDialog(matchedMappings);
            if (apply) {
                await this.scenarioService.applyScenario(matchedMappings);
                this.success = `Applied "${this.selectedScenario}" to ${matchedMappings.length} variables.`;
            }
        } catch (e: any) {
            this.error = e.message || 'Failed to apply scenario';
        }
    }

    private async showMissingDialog(missing: string[]): Promise<boolean> {
        const dialogRef = this.dialog.open(MissingVariablesDialogComponent, {
            width: '400px',
            data: { missingVariables: missing }
        });
        return await dialogRef.afterClosed().toPromise();
    }

    private async showPreviewDialog(mappings: ParameterMapping[]): Promise<boolean> {
        const dialogRef = this.dialog.open(PreviewDialogComponent, {
            width: '500px',
            data: { mappings }
        });
        return await dialogRef.afterClosed().toPromise();
    }

    reset(): void {
        this.csvFilePath = '';
        this.scenarioData = null;
        this.selectedScenario = '';
        this.error = '';
        this.success = '';
    }
}
