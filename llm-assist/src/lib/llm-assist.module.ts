import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LlmAssistComponent } from './llm-assist.component';
import { LlmAssistService } from './llm-assist.service';

@NgModule({
    declarations: [LlmAssistComponent],
    imports: [
        CommonModule,
        FormsModule,
        RouterModule.forChild([
            { path: '', component: LlmAssistComponent }
        ])
    ],
    providers: [LlmAssistService],
    exports: [LlmAssistComponent]
})
export class LlmAssistModule { }
