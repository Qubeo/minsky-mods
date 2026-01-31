import { ScenarioData, ParameterInfo } from '../models/scenario-data.model';

/** Parses enriched SST CSV format:
 * name,type,units,description,init,scenario1,scenario2,...
 */
export class CsvParser {
    static parse(csvText: string): ScenarioData {
        const lines = csvText.trim().split('\n').filter(line => line.trim());
        if (lines.length < 1) throw new Error('CSV file is empty');

        const headers = this.parseLine(lines[0]);
        const headerLower = headers.map(h => h.trim().toLowerCase());

        // Identify core columns
        const nameIdx = headerLower.findIndex(h => h === 'name');
        const typeIdx = headerLower.findIndex(h => h === 'type');
        const unitsIdx = headerLower.findIndex(h => h === 'units');
        const descIdx = headerLower.findIndex(h => h === 'description' || h === 'desc');
        const initIdx = headerLower.findIndex(h => h === 'init' || h === 'initialvalue' || h === 'initial_value');

        // Scenario columns start after init (or after desc if no init)
        const scenarioStart = initIdx !== -1 ? initIdx + 1 : (descIdx !== -1 ? descIdx + 1 : Math.max(typeIdx, unitsIdx) + 2);
        const scenarioNames = headers.slice(scenarioStart).map(h => h.trim());

        if (scenarioNames.length === 0) {
            throw new Error('CSV must have at least one scenario column');
        }

        const parameters: ParameterInfo[] = [];

        for (let i = 1; i < lines.length; i++) {
            const cells = this.parseLine(lines[i]);
            if (cells.length === 0 || !cells[nameIdx]?.trim()) continue;

            const name = cells[nameIdx]?.trim() || '';
            const type = (cells[typeIdx]?.trim().toLowerCase() || 'parameter') as 'parameter' | 'constant' | 'flow';
            const units = cells[unitsIdx]?.trim();
            const description = cells[descIdx]?.trim();
            const init = cells[initIdx]?.trim();

            // Parse scenario values
            const scenarioValues = new Map<string, number | null>();
            for (let j = 0; j < scenarioNames.length; j++) {
                const value = this.parseNumeric(cells[scenarioStart + j]?.trim());
                scenarioValues.set(scenarioNames[j], value);
            }

            parameters.push({
                name,
                type,
                units: units || undefined,
                description: description || undefined,
                init: init ? (isNaN(+init) ? init : parseFloat(init)) : undefined,
                scenarioValues
            });
        }

        return { parameters, scenarioNames };
    }

    private static parseLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
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
        if (!value) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
}
