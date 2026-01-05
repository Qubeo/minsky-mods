import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LlmAssistService, SelectionData } from './llm-assist.service';

@Component({
    selector: 'minsky-llm-assist',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="container">
      <header>
        <h1>AI Assistant</h1>
        <button class="refresh-btn" (click)="loadSelection()" [disabled]="loading">
          {{ loading ? '...' : '↻' }} Refresh Selection
        </button>
      </header>

      <section class="api-key-panel" *ngIf="!apiKey">
        <h2>⚙️ API Configuration</h2>
        <input 
          type="password" 
          class="api-key-input"
          [(ngModel)]="apiKeyInput"
          placeholder="Enter Anthropic API key (sk-ant-...)">
        <button class="save-key-btn" (click)="saveApiKey()" [disabled]="!apiKeyInput.trim()">
          Save API Key
        </button>
      </section>

      <section class="api-key-panel saved" *ngIf="apiKey">
        <div class="key-status">
          <span>✓ API Key configured</span>
          <button class="change-key-btn" (click)="changeApiKey()">Change</button>
        </div>
      </section>
      
      <section class="selection-panel">
        <h2>Selected Elements</h2>
        <textarea 
          class="selection-text" 
          [value]="selectionText" 
          readonly
          placeholder="Select items on the canvas, then click Refresh Selection"></textarea>
        <div class="item-count" *ngIf="selectionData.items.length > 0 || selectionData.wires.length > 0">
          {{ selectionData.items.length }} item(s), {{ selectionData.wires.length }} wire(s) selected
        </div>
      </section>

      <section class="prompt-panel">
        <h2>Ask AI</h2>
        <textarea 
          class="prompt-input"
          [(ngModel)]="prompt" 
          placeholder="Ask about the selected model elements..."
          (keydown.enter)="onEnter($event)"></textarea>
        <button class="send-btn" [disabled]="loading || !prompt.trim() || !apiKey" (click)="askAi()">
          {{ loading ? 'Thinking...' : 'Ask AI' }}
        </button>
      </section>

      <section class="response-panel" *ngIf="response">
        <h2>Response</h2>
        <div class="response-text">{{ response }}</div>
      </section>
    </div>
  `,
    styles: [`
    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #1a1a2e;
      color: #eee;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
    }

    h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #e94560;
    }

    h2 {
      margin: 0 0 12px 0;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
    }

    .refresh-btn {
      background: transparent;
      border: 1px solid #0f3460;
      color: #e94560;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #0f3460;
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    section {
      padding: 16px 20px;
    }

    .selection-panel {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 200px;
      border-bottom: 1px solid #0f3460;
    }

    .api-key-panel {
      padding: 16px 20px;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
    }

    .api-key-panel.saved {
      background: #1a2332;
    }

    .api-key-input {
      width: 70%;
      background: #0f0f1a;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #eee;
      font-family: inherit;
      font-size: 0.9rem;
      padding: 10px 12px;
      margin-right: 12px;
    }

    .api-key-input:focus {
      outline: none;
      border-color: #e94560;
    }

    .save-key-btn {
      background: #2ecc71;
      border: none;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }

    .save-key-btn:hover:not(:disabled) {
      background: #27ae60;
    }

    .save-key-btn:disabled {
      background: #444;
      cursor: not-allowed;
    }

    .key-status {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .key-status span {
      color: #2ecc71;
      font-size: 0.9rem;
    }

    .change-key-btn {
      background: transparent;
      border: 1px solid #0f3460;
      color: #e94560;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.8rem;
      transition: all 0.2s;
    }

    .change-key-btn:hover {
      background: #0f3460;
    }

    .selection-text {
      flex: 1;
      width: 100%;
      min-height: 180px;
      background: #0f0f1a;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #aaa;
      font-family: inherit;
      font-size: 0.8rem;
      padding: 12px;
      resize: vertical;
    }

    .item-count {
      margin-top: 8px;
      font-size: 0.75rem;
      color: #666;
    }

    .prompt-panel {
      flex: 0 0 auto;
      border-bottom: 1px solid #0f3460;
    }

    .prompt-input {
      width: 100%;
      height: 80px;
      background: #0f0f1a;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #eee;
      font-family: inherit;
      font-size: 0.9rem;
      padding: 12px;
      resize: none;
      margin-bottom: 12px;
    }

    .prompt-input:focus {
      outline: none;
      border-color: #e94560;
    }

    .send-btn {
      background: #e94560;
      border: none;
      color: white;
      padding: 10px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-weight: 500;
      transition: all 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #ff6b6b;
    }

    .send-btn:disabled {
      background: #444;
      cursor: not-allowed;
    }

    .response-panel {
      flex: 1;
      overflow-y: auto;
    }

    .response-text {
      background: #0f0f1a;
      border: 1px solid #0f3460;
      border-radius: 4px;
      padding: 16px;
      font-size: 0.9rem;
      line-height: 1.6;
      white-space: pre-wrap;
    }
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

    loadApiKey() {
        const stored = localStorage.getItem('llm-assist-api-key');
        if (stored) {
            this.apiKey = stored;
            this.llmService.setApiKey(stored);
        }
    }

    saveApiKey() {
        if (this.apiKeyInput.trim()) {
            this.apiKey = this.apiKeyInput.trim();
            localStorage.setItem('llm-assist-api-key', this.apiKey);
            this.llmService.setApiKey(this.apiKey);
            this.apiKeyInput = '';
        }
    }

    changeApiKey() {
        this.apiKey = '';
        this.apiKeyInput = '';
        localStorage.removeItem('llm-assist-api-key');
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
