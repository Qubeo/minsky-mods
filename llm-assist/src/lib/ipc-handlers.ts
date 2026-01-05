// Helper to get file paths (lazy loaded to avoid requiring Node modules at import time)
function getConfigPaths() {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const CONFIG_DIR = path.join(os.homedir(), '.minsky-llm-assist');
    const API_KEY_FILE = path.join(CONFIG_DIR, 'api-key');
    
    return { fs, path, CONFIG_DIR, API_KEY_FILE };
}

export const ipcHandlers = {
    'llm-save-api-key': async (apiKey: string) => {
        const { fs, CONFIG_DIR, API_KEY_FILE } = getConfigPaths();
        
        // Ensure config directory exists
        if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
        }
        
        fs.writeFileSync(API_KEY_FILE, apiKey, { mode: 0o600 });
        return true;
    },

    'llm-load-api-key': async () => {
        try {
            const { fs, API_KEY_FILE } = getConfigPaths();
            
            if (fs.existsSync(API_KEY_FILE)) {
                return fs.readFileSync(API_KEY_FILE, 'utf8');
            }
            return null;
        } catch (e) {
            console.error('Failed to load API key:', e);
            return null;
        }
    },

    'llm-clear-api-key': async () => {
        try {
            const { fs, API_KEY_FILE } = getConfigPaths();
            
            if (fs.existsSync(API_KEY_FILE)) {
                fs.unlinkSync(API_KEY_FILE);
            }
            return true;
        } catch (e) {
            console.error('Failed to clear API key:', e);
            return false;
        }
    },

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
