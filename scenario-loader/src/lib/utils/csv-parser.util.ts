import { ScenarioData, ScenarioColumn } from '../models/scenario-data.model';

export class CsvParser {
    static parse(csvText: string): ScenarioData {
        const lines = csvText.trim().split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }

        const headers = this.parseLine(lines[0]);

        if (headers.length < 2) {
            throw new Error('CSV must have at least one scenario column');
        }

        // Identify special columns (case-insensitive)
        const unitsIndex = headers.findIndex(h => h.toLowerCase() === 'units' || h.toLowerCase() === 'unit');
        const descIndex = headers.findIndex(h => h.toLowerCase() === 'description' || h.toLowerCase() === 'desc');

        // Identify scenario columns (all other columns starting from index 1)
        const scenarioIndices = headers.map((h, i) => i).filter(i => i > 0 && i !== unitsIndex && i !== descIndex);

        const scenarios: ScenarioColumn[] = scenarioIndices.map(i => ({
            name: headers[i].trim(),
            values: []
        }));

        const parameters: string[] = [];
        const units: string[] = [];
        const descriptions: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const cells = this.parseLine(lines[i]);
            if (cells.length === 0 || !cells[0].trim()) continue;

            parameters.push(cells[0].trim());

            // Extract metadata if columns exist
            if (unitsIndex !== -1) units.push(cells[unitsIndex]?.trim() || '');
            if (descIndex !== -1) descriptions.push(cells[descIndex]?.trim() || '');

            // Extract scenario values
            for (let j = 0; j < scenarioIndices.length; j++) {
                const colIndex = scenarioIndices[j];
                const value = cells[colIndex]?.trim();
                scenarios[j].values.push(this.parseNumeric(value));
            }
        }

        return {
            parameters,
            scenarios,
            units: unitsIndex !== -1 ? units : undefined,
            descriptions: descIndex !== -1 ? descriptions : undefined
        };
    }

    private static parseLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    private static parseNumeric(value: string | undefined): number | null {
        if (!value || value.trim() === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
}
