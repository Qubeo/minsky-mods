import { ScenarioGrowerComponent, ScenarioWiringComponent } from '@minsky/mod-scenario-grower';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimulationParametersComponent } from './simulation/simulation-parameters.component';

const routes: Routes = [
    { path: 'simulation-parameters', component: SimulationParametersComponent },
    { path: 'grow-scenario', component: ScenarioGrowerComponent },
    { path: 'wire-scenario', component: ScenarioWiringComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SimulationRoutingModule { }
