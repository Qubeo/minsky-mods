import { ScenarioLoaderComponent } from '@minsky/mod-scenario-loader';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimulationParametersComponent } from './simulation/simulation-parameters.component';

const routes: Routes = [
    { path: 'simulation-parameters', component: SimulationParametersComponent },
    { path: 'load-scenario', component: ScenarioLoaderComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SimulationRoutingModule { }
