import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvExportService, VariableRow } from './csv-export.service';

@Component({
  selector: 'minsky-csv-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="csv-export-container">
      <h3>Export Variables to CSV</h3>
      <p *ngIf="!loading && !error">
        Export all model variables (name, value, init, units, description, type) to a CSV file.
      </p>
      <p *ngIf="loading" class="loading">Loading variables...</p>
      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="variableCount > 0" class="count">Found {{ variableCount }} variables</p>
      <button (click)="exportCsv()" [disabled]="loading">
        {{ loading ? 'Exporting...' : 'Export CSV' }}
      </button>
    </div>
  `,
  styles: [`
    .csv-export-container {
      padding: 16px;
      font-family: sans-serif;
    }
    h3 { margin-top: 0; }
    button {
      padding: 8px 16px;
      background: #4a90d9;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    button:hover:not(:disabled) {
      background: #357abd;
    }
    .loading { color: #666; }
    .error { color: #c00; }
    .count { color: #060; font-weight: bold; }
  `],
})
export class CsvExportComponent {
  loading = false;
  error = '';
  variableCount = 0;
  private variables: VariableRow[] = [];

  constructor(private csvService: CsvExportService) {}

  async exportCsv(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.variables = await this.csvService.getVariables();
      this.variableCount = this.variables.length;
      const csv = this.csvService.toCsv(this.variables);
      this.csvService.downloadCsv(csv);
    } catch (e) {
      this.error = `Export failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      this.loading = false;
    }
  }
}
