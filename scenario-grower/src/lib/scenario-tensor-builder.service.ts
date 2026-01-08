import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';
import { VariableBase } from '@minsky/shared';
import { ScenarioData, ParameterInfo } from './models/scenario-data.model';

@Injectable({ providedIn: 'root' })
export class ScenarioTensorBuilderService {
    constructor(private electron: ElectronService) {}

    /**
     * Builds tensor-based scenario infrastructure from enriched SST.
     * Creates:
     * - ScenarioTensor: flattened 2D matrix [params × scenarios]
     * - SelectedScenario: control parameter
     * - idx_ParamName: semantic indices for scenario-dependent params
     * - ParamName: variables (wired via gather if scenario-dependent, else static)
     */
    async buildInfrastructure(data: ScenarioData): Promise<void> {
        console.time('ScenarioTensor.buildInfrastructure');

        const layout = { x: 100, y: 100, dx: 200, dy: 80 };
        let y = layout.y;

        // Separate scenario-dependent and independent parameters
        const withScenarios = data.parameters.filter(p => Array.from(p.scenarioValues.values()).some(v => v !== null));
        const withoutScenarios = data.parameters.filter(p => !withScenarios.includes(p));

        // 1. Create ScenarioTensor only if there are scenario-dependent params
        if (withScenarios.length > 0) {
            const tensorData = this.flattenTensor(withScenarios, data.scenarioNames);
            await this.createTensor('ScenarioTensor', tensorData, layout.x, y,
                `Scenario matrix: ${withScenarios.length} params × ${data.scenarioNames.length} scenarios`);
            y += layout.dy;

            // 2. Create SelectedScenario control
            await this.createVariable('SelectedScenario', 'parameter', '0', layout.x, y,
                'Active scenario index');
            y += layout.dy;

            // 3. Create scenario-dependent infrastructure
            y = layout.y + 2 * layout.dy;
            for (let i = 0; i < withScenarios.length; i++) {
                const param = withScenarios[i];
                const idxName = `idx_${param.name}`;

                // Create index constant
                await this.createVariable(idxName, 'constant', String(i), layout.x + layout.dx, y);

                // Create parameter variable (will be wired from gather)
                await this.createVariable(param.name, param.type, param.init?.toString() || '0',
                    layout.x + 3 * layout.dx, y, param.description);
                if (param.units) {
                    const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
                    await v.setUnits(param.units);
                }

                y += layout.dy;
            }
        }

        // 4. Create static (non-scenario) parameters
        if (withoutScenarios.length > 0) {
            y += layout.dy; // Spacing
            for (const param of withoutScenarios) {
                await this.createVariable(param.name, param.type, param.init?.toString() || '0',
                    layout.x, y, param.description);
                if (param.units) {
                    const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
                    await v.setUnits(param.units);
                }
                y += layout.dy;
            }
        }

        console.timeEnd('ScenarioTensor.buildInfrastructure');
        console.log(`Created ${withScenarios.length} scenario-dependent, ${withoutScenarios.length} static parameters`);
    }

    /** Flatten 2D scenario matrix to 1D array (row-major: [p0_s0, p0_s1, ..., p1_s0, p1_s1, ...]) */
    private flattenTensor(params: ParameterInfo[], scenarioNames: string[]): number[] {
        const result: number[] = [];
        for (const param of params) {
            for (const sceneName of scenarioNames) {
                result.push(param.scenarioValues.get(sceneName) ?? 0);
            }
        }
        return result;
    }

    private async createTensor(name: string, data: number[], x: number, y: number, desc?: string): Promise<void> {
        await this.electron.minsky.canvas.addVariable(`:${name}`, 'parameter');
        const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
        await v.moveTo(x, y);
        await v.init(JSON.stringify(data));
        if (desc) await v.tooltip(desc);
    }

    private async createVariable(name: string, type: 'parameter' | 'constant' | 'flow',
                                 init: string, x: number, y: number, desc?: string): Promise<void> {
        await this.electron.minsky.canvas.addVariable(`:${name}`, type);
        const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
        await v.moveTo(x, y);
        await v.init(init);
        if (desc) await v.tooltip(desc);
    }
}
