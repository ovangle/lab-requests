import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ExperimentalPlan } from "./experimental-plan";
import { ExperimentalPlanResearcherInfoComponent } from "./researcher/researcher-info.component";

@Component({
    selector: 'lab-experimental-plan-info',
    standalone: true,
    imports: [
        CommonModule,

        ExperimentalPlanResearcherInfoComponent
    ],
    template: `
    <h3>{{plan.title}}</h3>
    <div class="researcher">
        <lab-experimental-plan-researcher-info [plan]="plan">
        </lab-experimental-plan-researcher-info>
    </div>

    <p>{{plan.processSummary}}</p>
    `
})
export class ExperimentalPlanInfoComponent {
    @Input()
    plan: ExperimentalPlan;

}