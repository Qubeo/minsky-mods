import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ScenarioLoaderComponent } from './scenario-loader.component';

@NgModule({
    imports: [
        CommonModule,
        ScenarioLoaderComponent, // Component is standalone
        RouterModule.forChild([
            { path: '', component: ScenarioLoaderComponent }
        ])
    ]
})
export class ScenarioLoaderModule { }
