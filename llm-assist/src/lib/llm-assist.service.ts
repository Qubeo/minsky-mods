import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';
import { VariableBase, Port } from '@minsky/shared';

export interface SelectionItem {
    type: string;
    name: string;
    value?: number;
    init?: string;
    position: { x: number; y: number };
    tooltip?: string;
}

export interface SelectionWire {
    from: string;
    to: string;
}

export interface SelectionData {
    items: SelectionItem[];
    wires: SelectionWire[];
}

@Injectable({ providedIn: 'root' })
export class LlmAssistService {

    constructor(private electron: ElectronService) {}

    /**
     * Fetches the current canvas selection with rich metadata
     */
    async getSelection(): Promise<SelectionData> {
        const selection = this.electron.minsky.canvas.selection;
        const items: SelectionItem[] = [];
        const wires: SelectionWire[] = [];

        // Process items (variables, operations, etc.)
        const itemCount = await selection.items.size();
        for (let i = 0; i < itemCount; i++) {
            const item = selection.items.elem(i);
            try {
                const type = await item.classType();
                const [x, y] = await Promise.all([item.x(), item.y()]);
                const tooltip = await item.tooltip().catch(() => '');
                
                let name = tooltip || type;
                let value: number | undefined;
                let init: string | undefined;

                // For variables, get richer data
                if (type.includes('Variable')) {
                    const varItem = new VariableBase(item);
                    const [varName, varValue] = await Promise.all([
                        varItem.name().catch(() => ''),
                        varItem.value().catch(() => undefined)
                    ]);
                    if (varName) name = varName;
                    value = varValue;
                    // Try to get init if it exists
                    try {
                        init = await varItem.init();
                    } catch {}
                } else if (type === 'IntOp') {
                    // IntOp has a special intVar property
                    try {
                        const intOp = this.electron.minsky.namedItems.elem(await item.id());
                        const intVar = intOp.intVar;
                        const [varName, varValue] = await Promise.all([
                            intVar.name().catch(() => ''),
                            intVar.value().catch(() => undefined)
                        ]);
                        if (varName) name = `∫ ${varName}`;
                        value = varValue;
                        try {
                            init = await intVar.init();
                        } catch {}
                    } catch {}
                }

                items.push({ type, name, value, init, position: { x, y }, tooltip });
            } catch (e) {
                console.warn(`Failed to get item ${i}:`, e);
            }
        }

        // Process wires - get connected item names
        const wireCount = await selection.wires.size();
        for (let i = 0; i < wireCount; i++) {
            const wire = selection.wires.elem(i);
            try {
                // Get from/to ports and their connected items
                const fromPort = new Port(wire.$prefix() + '.from');
                const toPort = new Port(wire.$prefix() + '.to');
                
                const fromItem = await fromPort.item();
                const toItem = await toPort.item();
                
                // Get names via tooltip (most reliable)
                const [fromTooltip, toTooltip] = await Promise.all([
                    fromItem.tooltip().catch(() => 'unknown'),
                    toItem.tooltip().catch(() => 'unknown')
                ]);

                wires.push({ from: fromTooltip, to: toTooltip });
            } catch (e) {
                console.warn(`Failed to get wire ${i}:`, e);
            }
        }

        return { items, wires };
    }

    /**
     * Formats selection as text optimized for LLM understanding
     */
    formatSelectionAsText(data: SelectionData): string {
        if (data.items.length === 0 && data.wires.length === 0) {
            return 'No items selected.';
        }

        const lines: string[] = [];

        // Group items by type for clarity
        const variables = data.items.filter(i => i.type.includes('Variable'));
        const operations = data.items.filter(i => i.type.includes('Operation') || i.type === 'IntOp');
        const others = data.items.filter(i => !i.type.includes('Variable') && !i.type.includes('Operation') && i.type !== 'IntOp');

        if (variables.length > 0) {
            lines.push('VARIABLES:');
            for (const v of variables) {
                const val = v.value !== undefined ? ` = ${v.value}` : '';
                const init = v.init ? ` (init: ${v.init})` : '';
                lines.push(`  ${v.name}${val}${init}  @(${v.position.x.toFixed(0)}, ${v.position.y.toFixed(0)})`);
            }
            lines.push('');
        }

        if (operations.length > 0) {
            lines.push('OPERATIONS:');
            for (const op of operations) {
                const opType = op.type.replace('Operation:', '');
                lines.push(`  [${opType}] ${op.name}  @(${op.position.x.toFixed(0)}, ${op.position.y.toFixed(0)})`);
            }
            lines.push('');
        }

        if (others.length > 0) {
            lines.push('OTHER:');
            for (const o of others) {
                lines.push(`  [${o.type}] ${o.name}  @(${o.position.x.toFixed(0)}, ${o.position.y.toFixed(0)})`);
            }
            lines.push('');
        }

        if (data.wires.length > 0) {
            lines.push('CONNECTIONS:');
            for (const w of data.wires) {
                lines.push(`  ${w.from} → ${w.to}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Stub for future LLM API integration
     */
    async queryLlm(prompt: string, context: string): Promise<string> {
        console.log('[LLM-Assist] Query:', { prompt, contextLength: context.length });
        
        return `[Stub Response]\n\nYou asked: "${prompt}"\n\nContext:\n${context}\n\nIn a real implementation, this would query an LLM API.`;
    }
}
