import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ParameterMapping } from '../models/scenario-data.model';

@Component({
    selector: 'minsky-preview-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule],
    template: `
    <h2 mat-dialog-title>Preview Changes</h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.mappings" class="preview-table">
        <ng-container matColumnDef="parameter">
          <th mat-header-cell *matHeaderCellDef>Parameter</th>
          <td mat-cell *matCellDef="let m">{{ m.modelName || m.csvName }}</td>
        </ng-container>
        <ng-container matColumnDef="oldValue">
          <th mat-header-cell *matHeaderCellDef>Current</th>
          <td mat-cell *matCellDef="let m">{{ m.currentValue }}</td>
        </ng-container>
        <ng-container matColumnDef="arrow">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let m">→</td>
        </ng-container>
        <ng-container matColumnDef="newValue">
          <th mat-header-cell *matHeaderCellDef>New</th>
          <td mat-cell *matCellDef="let m" class="new-value">{{ m.newValue }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onApply()">Apply Scenario</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .preview-table { width: 100%; }
    .new-value { color: #4CAF50; font-weight: bold; }
    mat-dialog-content { max-height: 400px; overflow: auto; }
  `]
})
export class PreviewDialogComponent {
    displayedColumns = ['parameter', 'oldValue', 'arrow', 'newValue'];

    constructor(
        private dialogRef: MatDialogRef<PreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { mappings: ParameterMapping[] }
    ) { }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onApply(): void {
        this.dialogRef.close(true);
    }
}
