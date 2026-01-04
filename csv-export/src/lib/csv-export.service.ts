import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';

export interface VariableRow {
  name: string;
  value: number;
  init: string;
  units: string;
  description: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  constructor(private electronService: ElectronService) {}

  async getVariables(): Promise<VariableRow[]> {
    const keys = await this.electronService.minsky.variableValues.keys();
    const rows: VariableRow[] = [];

    // Filter out internal constants
    const userKeys = keys.filter(k => !k.startsWith('constant:'));

    // Fetch data for each variable in parallel batches
    const batchSize = 20;
    for (let i = 0; i < userKeys.length; i += batchSize) {
      const batch = userKeys.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (key) => {
          const v = this.electronService.minsky.variableValues.elem(key);
          const [name, value, init, units, description, type] = await Promise.all([
            v.name(),
            v.value(),
            v.init(),
            v.units.str(),
            v.detailedText(),
            v.type(),
          ]);
          return { name, value, init, units, description, type };
        })
      );
      rows.push(...batchResults);
    }

    return rows;
  }

  toCsv(rows: VariableRow[]): string {
    const headers = ['name', 'value', 'init', 'units', 'description', 'type'];
    const lines: string[] = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h as keyof VariableRow];
        // Escape quotes and wrap in quotes if contains comma or quote
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  downloadCsv(csv: string, filename: string = 'variables.csv'): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
