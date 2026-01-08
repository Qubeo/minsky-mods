import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScenarioGrowerComponent } from './scenario-grower.component';

@NgModule({
    imports: [
        CommonModule,
        ScenarioGrowerComponent,
        RouterModule.forChild([
            { path: '', component: ScenarioGrowerComponent }
        ])
    ]
})
export class ScenarioGrowerModule { }
