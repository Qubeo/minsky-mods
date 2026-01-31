import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScenarioRavelerComponent } from './scenario-raveler.component';

@NgModule({
    imports: [
        CommonModule,
        ScenarioRavelerComponent,
        RouterModule.forChild([
            { path: '', component: ScenarioRavelerComponent }
        ])
    ]
})
export class ScenarioRavelerModule { }
