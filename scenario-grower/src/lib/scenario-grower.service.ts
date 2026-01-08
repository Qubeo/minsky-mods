import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';
import { CsvParser } from './utils/csv-parser.util';
import { ScenarioData } from './models/scenario-data.model';

/**
 * Minimal service for CSV parsing.
 * New architecture uses CsvParser and ScenarioTensorBuilderService directly.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioGrowerService {
    constructor(private electronService: ElectronService) {}

    async readCsvFile(filePath: string): Promise<string> {
        return await this.electronService.invoke('read-file-text', filePath);
    }

    parseScenarioData(csvText: string): ScenarioData {
        return CsvParser.parse(csvText);
    }
}
