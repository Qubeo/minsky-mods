import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';
import { VariableBase } from '@minsky/shared';

export interface TensorMetadata {
    paramNames: string[];
    scenarioNames: string[];
    numParams: number;
    numScenarios: number;
    paramAxisName: string;    // Actual axis name for parameters (columns)
    scenarioAxisName: string; // Actual axis name for scenarios (rows)
}

/**
 * Wires parameters from an existing ScenarioTensor variable.
 * Assumes tensor is already populated (via Import CSV or manual creation).
 * Creates: idx_ParamName constants, ParamName variables, and wiring.
 */
@Injectable({ providedIn: 'root' })
export class ScenarioWiringService {
    constructor(private electron: ElectronService) {}

    /**
     * Gets variableValue by name (with or without colon prefix).
     */
    async getVariableValue(name: string): Promise<any | null> {
        try {
            const cleanName = name.startsWith(':') ? name : `:${name}`;
            return this.electron.minsky.variableValues.elem(cleanName);
        } catch {
            return null;
        }
    }

    /**
     * Finds a canvas Item by name, searching recursively through groups.
     * Uses the exact name from VariableValue to avoid name format issues.
     */
    private async findCanvasItemRecursive(exactName: string): Promise<any | null> {
        try {
            // Search top-level items recursively
            const numItems = await this.electron.minsky.model.numItems();
            console.log(`Searching ${numItems} top-level items for name: "${exactName}"`);
            
            for (let i = 0; i < numItems; i++) {
                const item = await this.electron.minsky.model.items.elem(i);
                const found = await this.checkItemByName(item, exactName, 0);
                if (found) return found;
            }
            
            console.log(`No item found with name "${exactName}" in ${numItems} top-level items`);
            return null;
        } catch (e) {
            console.error('Error finding canvas item recursively:', e);
            return null;
        }
    }

    /**
     * Recursively checks if an item matches the name, and searches inside groups.
     */
    private async checkItemByName(item: any, exactName: string, depth: number = 0): Promise<any | null> {
        try {
            // Check if this item's name matches
            try {
                const classType = await item.classType?.();
                
                // For variables, we need to wrap in VariableBase to get the name
                let itemName: string | undefined;
                if (classType && (classType.includes('Variable') || classType === 'VarConstant')) {
                    try {
                        const varItem = new VariableBase(item);
                        itemName = await varItem.name();
                        console.log(`  [depth ${depth}] Found variable: name="${itemName}", classType="${classType}"`);
                    } catch (e) {
                        console.debug(`  [depth ${depth}] Could not get name from VariableBase:`, e);
                    }
                } else {
                    // For non-variables, try direct name access
                    itemName = await item.name?.();
                }
                
                // Match exact name, or with/without colon prefix
                if (itemName) {
                    const nameMatches = itemName === exactName || 
                        itemName === `:${exactName}` || 
                        itemName === exactName.substring(1) ||
                        (exactName.startsWith(':') && itemName === exactName.substring(1));
                    
                    if (nameMatches) {
                        console.log(`  ✓ Match found! name="${itemName}", exactName="${exactName}"`);
                        return item;
                    }
                }
            } catch (e) {
                // Can't get name - continue
                console.debug(`  [depth ${depth}] Could not get name:`, e);
            }

            // If it's a group, search inside it recursively
            try {
                const classType = await item.classType?.();
                if (classType === 'Group') {
                    const numItems = await item.items.size();
                    console.log(`  [depth ${depth}] Searching inside Group with ${numItems} items`);
                    for (let i = 0; i < numItems; i++) {
                        const subItem = await item.items.elem(i);
                        const found = await this.checkItemByName(subItem, exactName, depth + 1);
                        if (found) return found;
                    }
                }
            } catch (e) {
                // Not a group or can't access items
                console.debug(`  [depth ${depth}] Could not access group items:`, e);
            }

            return null;
        } catch (e) {
            console.debug(`  [depth ${depth}] Error in checkItemByName:`, e);
            return null;
        }
    }

    /**
     * Reads tensor structure from hypercube JSON.
     * Returns parameter names (columns) and attribute/scenario names (rows).
     */
    async readTensorStructure(tensorName: string): Promise<TensorMetadata | null> {
        try {
            const varValue = await this.getVariableValue(tensorName);
            if (!varValue) {
                console.error('Variable not found:', tensorName);
                return null;
            }

            const hypercube = await varValue.hypercube();
            console.log('Hypercube object:', hypercube);

            // xvectors[0].slices = parameter names (columns)
            // xvectors[1].slices = attribute/scenario names (rows)
            const xvectors = hypercube.xvectors || [];
            const paramNames = xvectors[0]?.slices || [];
            const rowLabels = xvectors[1]?.slices || [];

            // Extract actual axis names (critical for gather operations)
            const paramAxisName = xvectors[0]?.name || 'name';
            const scenarioAxisName = xvectors[1]?.name || 'attribute';

            console.log('Extracted parameter names:', paramNames);
            console.log('Extracted row labels:', rowLabels);
            console.log('Axis names - param:', paramAxisName, 'scenario:', scenarioAxisName);

            if (paramNames.length === 0 || rowLabels.length === 0) {
                throw new Error('Could not extract xvector slices from hypercube');
            }

            return {
                paramNames,
                scenarioNames: rowLabels,
                numParams: paramNames.length,
                numScenarios: rowLabels.length,
                paramAxisName,
                scenarioAxisName
            };
        } catch (e) {
            console.error('Failed to read tensor structure:', e);
            return null;
        }
    }

    /**
     * Main wiring workflow:
     * 1. Accept user-supplied parameter names and scenario names
     * 2. Create SelectedScenario control
     * 3. For each parameter: create idx_*, create variable, prepare wiring
     * 4. Return wiring configuration for user verification
     */
    async wireScenarioParameters(
        tensorName: string,
        paramNames: string[],
        scenarioNames: string[],
        existingSelectedScenario?: string
    ): Promise<void> {
        console.time('wireScenarioParameters');
        console.log('Wiring parameters for tensor:', tensorName);
        console.log('Parameter names:', paramNames);
        console.log('Scenario names:', scenarioNames);

        // Verify tensor exists and get its exact name
        const tensorVar = await this.getVariableValue(tensorName);
        if (!tensorVar) {
            throw new Error(`Tensor variable "${tensorName}" not found`);
        }
        console.log('Tensor variable found');
        
        // Get the exact name from the variable value - this is more reliable than the input name
        const exactTensorName = await tensorVar.name();
        console.log('Tensor exact name from VariableValue:', exactTensorName);
        
        // Debug: List all top-level items to see what we have
        const numTopLevelItems = await this.electron.minsky.model.numItems();
        console.log(`Top-level items count: ${numTopLevelItems}`);
        for (let i = 0; i < Math.min(numTopLevelItems, 10); i++) {
            try {
                const item = await this.electron.minsky.model.items.elem(i);
                const classType = await item.classType?.();
                let itemName = 'no-name';
                // For variables, use VariableBase to get name
                if (classType && (classType.includes('Variable') || classType === 'VarConstant')) {
                    try {
                        const varItem = new VariableBase(item);
                        itemName = await varItem.name();
                    } catch (e) {
                        itemName = 'error-getting-name';
                    }
                } else {
                    itemName = await item.name?.().catch(() => 'no-name');
                }
                console.log(`  Item ${i}: classType="${classType}", name="${itemName}"`);
            } catch (e) {
                console.log(`  Item ${i}: error getting info -`, e);
            }
        }

        // Find the canvas item once by name (searching recursively) - we'll reuse it in the loop
        const tensorItem = await this.findCanvasItemRecursive(exactTensorName);
        if (!tensorItem) {
            throw new Error(`Could not get canvas item for variable ${tensorName} (exact name: ${exactTensorName})`);
        }
        console.log('Tensor canvas item found');

        const layout = { x: 100, y: 100, dx: 200, dy: 80 };
        let y = layout.y;

        // 1. Create SelectedScenario control
        const selectedScenarioName = existingSelectedScenario || 'SelectedScenario';
        console.log('Creating SelectedScenario variable');
        await this.createParameter(selectedScenarioName, '0', layout.x, y, `Scenario selector (0-${scenarioNames.length - 1})`);
        const selectedScenarioItem = new VariableBase(this.electron.minsky.canvas.itemFocus);
        y += layout.dy;

        // 2. Create infrastructure for each parameter
        for (let i = 0; i < paramNames.length; i++) {
            const paramName = paramNames[i];
            const idxName = `idx_${paramName}`;

            console.log(`Creating infrastructure for parameter ${i}: ${paramName}`);

            // Create index parameter (column index in tensor)
            await this.createParameter(idxName, String(i), layout.x + layout.dx, y, `Column index for ${paramName}`);
            const idxItem = new VariableBase(this.electron.minsky.canvas.itemFocus);

            // Create gather operations
            const gather1X = layout.x + 2 * layout.dx;
            const gather2X = layout.x + 4 * layout.dx;

            await this.electron.minsky.canvas.addOperation('gather');
            const gather1 = new (await import('@minsky/shared')).OperationBase(this.electron.minsky.canvas.itemFocus);
            await gather1.moveTo(gather1X, y);
            await gather1.axis('name');

            await this.electron.minsky.canvas.addOperation('gather');
            const gather2 = new (await import('@minsky/shared')).OperationBase(this.electron.minsky.canvas.itemFocus);
            await gather2.moveTo(gather2X, y);
            await gather2.axis('attribute');

            // Create parameter variable
            await this.createParameter(paramName, '0', layout.x + 5 * layout.dx, y, paramName);
            const paramItem = new VariableBase(this.electron.minsky.canvas.itemFocus);

            // Wire connections (use model.addWire instead of canvas.addWire)
            // Reuse the tensorItem we found at the start
            const tensorPort = await tensorItem.ports(0);
            await this.electron.minsky.model.addWire(tensorPort, await gather1.ports(1));

            const idxPort = await idxItem.ports(0);
            await this.electron.minsky.model.addWire(idxPort, await gather1.ports(2));

            await this.electron.minsky.model.addWire(await gather1.ports(0), await gather2.ports(1));

            const selectedPort = await selectedScenarioItem.ports(0);
            await this.electron.minsky.model.addWire(selectedPort, await gather2.ports(2));

            await this.electron.minsky.model.addWire(await gather2.ports(0), await paramItem.ports(1));

            y += layout.dy;
        }

        console.timeEnd('wireScenarioParameters');
        console.log(`Created ${paramNames.length} parameter indices, gathers, and variables`);
    }

    private async createParameter(
        name: string,
        init: string,
        x: number,
        y: number,
        description?: string
    ): Promise<void> {
        try {
            await this.electron.minsky.canvas.addVariable(`:${name}`, 'parameter');
            const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
            await v.moveTo(x, y);
            await v.init(init);
            if (description) await v.tooltip(description);
        } catch (e) {
            console.warn(`Variable ${name} creation failed (might already exist):`, e);
        }
    }

    private async createConstant(
        name: string,
        value: string,
        x: number,
        y: number,
        description?: string
    ): Promise<void> {
        try {
            await this.electron.minsky.canvas.addVariable(`:${name}`, 'constant');
            const v = new VariableBase(this.electron.minsky.canvas.itemFocus);
            await v.moveTo(x, y);
            await v.init(value);
            if (description) await v.tooltip(description);
        } catch (e) {
            console.warn(`Constant ${name} creation failed (might already exist):`, e);
        }
    }
}
