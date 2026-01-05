import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmAssistService, SelectionData } from './llm-assist.service';

@Component({
    selector: 'minsky-llm-assist',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="app">
      <div class="header">
        <h1>AI Assistant</h1>
        <button (click)="loadSelection()" [disabled]="loading">↻ Refresh</button>
      </div>

      <div class="content">
        <div class="box" *ngIf="!apiKey">
          <label>API Key</label>
          <input type="password" [(ngModel)]="apiKeyInput" placeholder="sk-ant-...">
          <button (click)="saveApiKey()" [disabled]="!apiKeyInput.trim()">Save API Key</button>
        </div>

        <div class="box success" *ngIf="apiKey">
          <span>✓ API Key configured</span>
          <button (click)="changeApiKey()">Change</button>
        </div>

        <div class="box">
          <label>Selected Elements ({{ selectionData.items.length }})</label>
          <textarea readonly [value]="selectionText" placeholder="Select items, click Refresh"></textarea>
        </div>

        <div class="box">
          <label>Your Question</label>
          <textarea [(ngModel)]="prompt" placeholder="Ask about the model..." (keydown.enter)="onEnter($event)"></textarea>
          <button (click)="askAi()" [disabled]="loading || !prompt.trim() || !apiKey">
            {{ loading ? 'Thinking...' : 'Ask AI' }}
          </button>
        </div>

        <div class="box" *ngIf="response">
          <label>Response</label>
          <div class="response">{{ response }}</div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .app {
      height: 100vh;
      background: #1e1e1e;
      color: #e0e0e0;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .header {
      background: #2d2d2d;
      padding: 12px 20px;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 { font-size: 1.1rem; color: #ff79c6; }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .box {
      background: #2d2d2d;
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 8px;
      border: 1px solid #444;
    }

    .box.success {
      background: #1e3a2d;
      border-color: #50fa7b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .box.success span { color: #50fa7b; }

    label {
      display: block;
      font-size: 0.7rem;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }

    input, textarea {
      width: 100%;
      background: #1a1a1a;
      border: 1px solid #444;
      color: #e0e0e0;
      padding: 10px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      margin-bottom: 10px;
    }

    input:focus, textarea:focus {
      outline: none;
      border-color: #ff79c6;
    }

    textarea {
      min-height: 120px;
      resize: vertical;
      line-height: 1.4;
    }

    .response {
      background: #1a1a1a;
      border: 1px solid #444;
      padding: 12px;
      border-radius: 6px;
      white-space: pre-wrap;
      line-height: 1.5;
      font-size: 0.9rem;
      max-height: 400px;
      overflow-y: auto;
    }

    button {
      background: #ff79c6;
      color: #1e1e1e;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
    }

    button:hover:not(:disabled) { background: #ff92d0; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }

    .box.success button {
      background: transparent;
      border: 1px solid #50fa7b;
      color: #50fa7b;
      padding: 4px 12px;
    }

    .box.success button:hover { background: #50fa7b; color: #1e1e1e; }
  `]
})
export class LlmAssistComponent implements OnInit {
    selectionData: SelectionData = { items: [], wires: [] };
    selectionText = '';
    prompt = '';
    response = '';
    loading = false;
    apiKey = '';
    apiKeyInput = '';

    constructor(private llmService: LlmAssistService) {}

    ngOnInit() {
        this.loadApiKey();
        this.loadSelection();
    }

    async loadApiKey() {
        try {
            const stored = await this.llmService.loadApiKey();
            if (stored) {
                this.apiKey = stored;
                this.llmService.setApiKey(stored);
            }
        } catch (e) {
            console.warn('Failed to load API key:', e);
        }
    }

    async saveApiKey() {
        if (this.apiKeyInput.trim()) {
            this.apiKey = this.apiKeyInput.trim();
            await this.llmService.saveApiKey(this.apiKey);
            this.llmService.setApiKey(this.apiKey);
            this.apiKeyInput = '';
        }
    }

    async changeApiKey() {
        this.apiKey = '';
        this.apiKeyInput = '';
        await this.llmService.clearApiKey();
    }

    async loadSelection() {
        this.loading = true;
        try {
            this.selectionData = await this.llmService.getSelection();
            this.selectionText = this.llmService.formatSelectionAsText(this.selectionData);
        } catch (e) {
            this.selectionText = `Error loading selection: ${e}`;
        } finally {
            this.loading = false;
        }
    }

    onEnter(event: Event) {
        if (!(event as KeyboardEvent).shiftKey) {
            event.preventDefault();
            this.askAi();
        }
    }

    async askAi() {
        if (!this.prompt.trim() || this.loading || !this.apiKey) return;

        this.loading = true;
        this.response = '';

        try {
            this.response = await this.llmService.queryLlm(this.prompt, this.selectionText);
        } catch (e) {
            this.response = `Error: ${e instanceof Error ? e.message : String(e)}`;
        } finally {
            this.loading = false;
        }
    }
}
