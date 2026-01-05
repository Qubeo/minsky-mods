import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LlmAssistComponent } from './llm-assist.component';

@NgModule({
    imports: [
        RouterModule.forChild([
            { path: '', component: LlmAssistComponent }
        ])
    ]
})
export class LlmAssistModule { }
