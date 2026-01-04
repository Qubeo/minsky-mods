import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvExportService, VariableRow } from './csv-export.service';

@Component({
  selector: 'minsky-csv-export',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="csv-export-container">
      <h3>Export System Variables</h3>
      <p>This tool captures the current state of all model variables and exports them to a CSV file for external analysis.</p>
      
      <div class="actions">
        <button (click)="exportCsv()" [disabled]="loading">
          <span *ngIf="!loading">🚀 Export to CSV</span>
          <span *ngIf="loading">⚙️ Processing...</span>
        </button>
      </div>

      <div *ngIf="variableCount > 0" class="status-success">
        ✅ Captured <span class="count">{{ variableCount }}</span> variables. Download started.
      </div>

      <div *ngIf="error" class="error">
        ❌ {{ error }}
      </div>

      <div class="info-footer">
        <small>Variables include: name, value, initial value, units, description, and type.</small>
      </div>
    </div>
  `,
  styles: [`
    .csv-export-container {
      padding: 24px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      background: #fdfdfd;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    h3 { margin-top: 0; color: #333; font-weight: 600; }
    p { color: #666; font-size: 14px; line-height: 1.6; }
    
    .actions {
      margin: 20px 0;
      display: flex;
      justify-content: center;
    }
    
    button {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      background: #4a90e2;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
    }
    
    button:disabled {
      background: #b0c4de;
      cursor: not-allowed;
      box-shadow: none;
    }
    
    button:hover:not(:disabled) {
      background: #357abd;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(74, 144, 226, 0.3);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    .status-success {
      margin-top: 15px;
      padding: 12px;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 6px;
      font-size: 14px;
    }

    .error {
      margin-top: 15px;
      padding: 12px;
      background: #ffebee;
      color: #c62828;
      border-radius: 6px;
      font-size: 14px;
    }

    .count { font-weight: 700; color: #1b5e20; }
    
    .info-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
      color: #999;
      text-align: center;
    }
  `],
})
export class CsvExportComponent {
  loading = false;
  error = '';
  variableCount = 0;
  private variables: VariableRow[] = [];

  constructor(private csvService: CsvExportService) { }

  async exportCsv(): Promise<void> {
    this.loading = true;
    this.error = '';
    this.variableCount = 0;

    try {
      this.variables = await this.csvService.getVariables();
      this.variableCount = this.variables.length;
      if (this.variableCount === 0) {
        throw new Error('No variables found to export.');
      }
      const csv = this.csvService.toCsv(this.variables);
      this.csvService.downloadCsv(csv);
    } catch (e) {
      this.error = `Export failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      this.loading = false;
    }
  }
}
