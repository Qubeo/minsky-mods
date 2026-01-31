import { ParameterMapping, ValidationResult } from '../models/scenario-data.model';
import { ElectronService } from '@minsky/core';

export class VariableMatcher {
    static async matchVariables(
        csvParameters: string[],
        scenarioValues: (number | null)[],
        units: string[],
        descriptions: string[],
        electronService: ElectronService
    ): Promise<ParameterMapping[]> {
        console.time('Minsky:variableValues.keys');
        console.log('Requesting variable names from backend...');
        const existingNames = await electronService.minsky.variableValues.keys();
        console.timeEnd('Minsky:variableValues.keys');
        console.log(`Received ${existingNames.length} variable names.`);
        if (existingNames.length > 0) console.log('Sample keys:', existingNames.slice(0, 10));
        console.log('Seeking parameters:', csvParameters);

        console.time('Mod:VariableMatcher.processing');
        const mappings: ParameterMapping[] = [];

        // Optimize: Fetch only necessary variable data in parallel
        const promises = csvParameters.map(async (param, i) => {
            // Try exact match first, then with colon prefix
            let index = existingNames.indexOf(param);
            if (index === -1) index = existingNames.indexOf(`:${param}`);

            const matched = index !== -1;
            const matchedName = matched ? existingNames[index] : '';

            let init = '0';
            let valueId = '';

            if (matched) {
                try {
                    const v = electronService.minsky.variableValues.elem(matchedName);
                    // Fetch init and valueId for this variable
                    [init, valueId] = await Promise.all([v.init(), v.valueId()]);
                } catch (e) {
                    console.error(`Failed to fetch details for ${param}`, e);
                }
            }

            // Note: scenarioValues aligns with csvParameters
            const newValue = scenarioValues[i] ?? 0; // default to 0 if missing

            return {
                csvName: param, // CSV Header name
                modelName: matchedName, // Use the actual name found in Minsky
                valueId: valueId,
                currentValue: init,
                newValue,
                matched,
                units: units[i] || '',
                description: descriptions[i] || ''
            };
        });

        const results = await Promise.all(promises);
        mappings.push(...results);

        console.timeEnd('Mod:VariableMatcher.processing');
        return mappings;
    }

    static validateMappings(mappings: ParameterMapping[]): ValidationResult {
        const missingVariables = mappings
            .filter(m => !m.matched)
            .map(m => m.csvName);

        const matchedCount = mappings.filter(m => m.matched).length;

        return {
            valid: matchedCount > 0,
            errors: matchedCount === 0 ? ['No variables from CSV found in model'] : [],
            warnings: [],
            missingVariables,
            mappings
        };
    }
}
