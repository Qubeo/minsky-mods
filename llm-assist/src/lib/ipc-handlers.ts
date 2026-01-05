export const ipcHandlers = {
    'llm-generate': async (params: { apiKey: string; systemPrompt: string; userPrompt: string }) => {
        console.log(`[Mod: LLM-Assist] Generating for: ${params.userPrompt}`);

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': params.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    system: params.systemPrompt,
                    messages: [
                        {
                            role: 'user',
                            content: params.userPrompt
                        }
                    ]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                return { error: `API Error: ${error.error?.message || response.statusText}` };
            }

            const data = await response.json();
            return { text: data.content[0].text };
        } catch (e) {
            console.error('[LLM-Assist] API Error:', e);
            return { error: e instanceof Error ? e.message : String(e) };
        }
    }
};
