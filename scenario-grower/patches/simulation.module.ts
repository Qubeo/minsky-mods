import { ScenarioGrowerComponent, ScenarioWiringComponent } from '@minsky/mod-scenario-grower';
import { CommonModule } from '@angular/core';
import { NgModule } from '@angular/core';
import { SimulationRoutingModule } from './simulation-routing.module';
import { SimulationParametersComponent } from './simulation/simulation-parameters.component';


@NgModule({
    imports: [CommonModule, SimulationRoutingModule, SimulationParametersComponent, ScenarioGrowerComponent, ScenarioWiringComponent],
})
export class SimulationModule { }
