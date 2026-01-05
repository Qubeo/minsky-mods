import { Component, OnInit } from '@angular/core';
import { LlmAssistService, SelectionItem } from './llm-assist.service';

@Component({
    selector: 'minsky-llm-assist',
    template: `
    <div class="container">
      <header>
        <h1>AI Assistant</h1>
        <button class="refresh-btn" (click)="loadSelection()" [disabled]="loading">
          {{ loading ? '...' : '↻' }} Refresh Selection
        </button>
      </header>
      
      <section class="selection-panel">
        <h2>Selected Elements</h2>
        <textarea 
          class="selection-text" 
          [value]="selectionText" 
          readonly
          placeholder="Select items on the canvas, then click Refresh Selection"></textarea>
        <div class="item-count" *ngIf="selectedItems.length > 0">
          {{ selectedItems.length }} item(s) selected
        </div>
      </section>

      <section class="prompt-panel">
        <h2>Ask AI</h2>
        <textarea 
          class="prompt-input"
          [(ngModel)]="prompt" 
          placeholder="Ask about the selected model elements..."
          (keydown.enter)="onEnter($event)"></textarea>
        <button class="send-btn" [disabled]="loading || !prompt.trim()" (click)="askAi()">
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
      flex: 0 0 auto;
      border-bottom: 1px solid #0f3460;
    }

    .selection-text {
      width: 100%;
      height: 120px;
      background: #0f0f1a;
      border: 1px solid #0f3460;
      border-radius: 4px;
      color: #aaa;
      font-family: inherit;
      font-size: 0.8rem;
      padding: 12px;
      resize: none;
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
    selectedItems: SelectionItem[] = [];
    selectionText = '';
    prompt = '';
    response = '';
    loading = false;

    constructor(private llmService: LlmAssistService) {}

    ngOnInit() {
        this.loadSelection();
    }

    async loadSelection() {
        this.loading = true;
        try {
            this.selectedItems = await this.llmService.getSelection();
            this.selectionText = this.llmService.formatSelectionAsText(this.selectedItems);
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
        if (!this.prompt.trim() || this.loading) return;

        this.loading = true;
        this.response = '';

        try {
            this.response = await this.llmService.queryLlm(this.prompt, this.selectionText);
        } catch (e) {
            this.response = `Error: ${e}`;
        } finally {
            this.loading = false;
        }
    }
}
