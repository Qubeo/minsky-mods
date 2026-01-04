import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'minsky-missing-variables-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule],
    template: `
    <h2 mat-dialog-title>Missing Variables</h2>
    <mat-dialog-content>
      <p>The following variables from the CSV were not found in the model:</p>
      <mat-list>
        <mat-list-item *ngFor="let varName of data.missingVariables">
          {{ varName }}
        </mat-list-item>
      </mat-list>
      <p>Would you like to create them as new global parameters?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onCreate()">Create Parameters</button>
    </mat-dialog-actions>
  `,
    styles: [`
    mat-list-item { font-family: monospace; }
    mat-dialog-content { max-height: 300px; }
  `]
})
export class MissingVariablesDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<MissingVariablesDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { missingVariables: string[] }
    ) { }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onCreate(): void {
        this.dialogRef.close(true);
    }
}
