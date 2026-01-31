import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScenarioWiringComponent } from './scenario-wiring.component';

@NgModule({
    imports: [
        CommonModule,
        ScenarioWiringComponent,
        RouterModule.forChild([
            { path: '', component: ScenarioWiringComponent }
        ])
    ]
})
export class ScenarioWiringModule { }
