import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';

export interface MinskyMetadataRow {
  name: string;
  units: string;
  description: string;
  type: string;
  value: number | string;
  init: string;
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private readonly headers = ['name', 'units', 'description', 'type', 'value', 'init'];

  constructor(private electronService: ElectronService) { }

  async getVariables(): Promise<MinskyMetadataRow[]> {
    const keys = await this.electronService.minsky.variableValues.keys();
    const rows: MinskyMetadataRow[] = [];

    const userKeys = keys.filter(k => !k.startsWith('constant:'));

    const batchSize = 50;
    for (let i = 0; i < userKeys.length; i += batchSize) {
      const batch = userKeys.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (key) => {
          try {
            const v = this.electronService.minsky.variableValues.elem(key);
            const [name, value, init, units, description, type] = await Promise.all([
              v.name(),
              v.value(),
              v.init(),
              v.units.str().catch(() => ''),
              v.detailedText().catch(() => ''),
              v.type(),
            ]);
            return {
              name: name || key,
              units: units || '',
              description: description || '',
              type: type || 'variable',
              value: value !== undefined ? value : 0,
              init: init || '',
            };
          } catch (err) {
            console.error(`Failed to fetch variable metadata for ${key}:`, err);
            return null;
          }
        })
      );
      rows.push(...batchResults.filter((r): r is MinskyMetadataRow => r !== null));
    }

    return rows;
  }

  toCsv(rows: MinskyMetadataRow[]): string {
    const lines: string[] = [this.headers.join(',')];

    for (const row of rows) {
      const values = this.headers.map((h) => {
        const val = row[h as keyof MinskyMetadataRow];
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
