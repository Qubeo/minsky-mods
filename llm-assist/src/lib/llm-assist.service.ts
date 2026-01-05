import { Injectable } from '@angular/core';
import { ElectronService } from '@minsky/core';

export interface SelectionItem {
    type: string;
    id: string;
    details: string;
}

@Injectable({ providedIn: 'root' })
export class LlmAssistService {

    constructor(private electron: ElectronService) {}

    /**
     * Fetches the current canvas selection and returns structured items
     */
    async getSelection(): Promise<SelectionItem[]> {
        const selection = this.electron.minsky.canvas.selection;
        const itemCount = await selection.items.size();
        const items: SelectionItem[] = [];

        for (let i = 0; i < itemCount; i++) {
            const item = selection.items.elem(i);
            try {
                const [type, id, details] = await Promise.all([
                    item.classType(),
                    item.id(),
                    item.detailedText().catch(() => '')
                ]);
                items.push({ type, id, details });
            } catch (e) {
                console.warn(`Failed to get item ${i}:`, e);
            }
        }

        // Also get wires
        const wireCount = await selection.wires.size();
        for (let i = 0; i < wireCount; i++) {
            const wire = selection.wires.elem(i);
            try {
                const id = await wire.id();
                items.push({ type: 'Wire', id, details: '' });
            } catch (e) {
                console.warn(`Failed to get wire ${i}:`, e);
            }
        }

        return items;
    }

    /**
     * Formats selection items as text for LLM context
     */
    formatSelectionAsText(items: SelectionItem[]): string {
        if (items.length === 0) {
            return 'No items selected.';
        }

        const lines = ['Selected model elements:', ''];
        for (const item of items) {
            lines.push(`- [${item.type}] ${item.id}`);
            if (item.details) {
                lines.push(`  ${item.details}`);
            }
        }
        return lines.join('\n');
    }

    /**
     * Stub for future LLM API integration
     */
    async queryLlm(prompt: string, context: string): Promise<string> {
        // TODO: Integrate with actual LLM API (OpenAI, Anthropic, etc.)
        console.log('[LLM-Assist] Query:', { prompt, contextLength: context.length });
        
        return `[Stub Response]\n\nYou asked: "${prompt}"\n\nContext provided: ${context.length} characters\n\nIn a real implementation, this would query an LLM API.`;
    }
}
