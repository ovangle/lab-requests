import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ExperimentalPlanResearcherInfoComponent } from "./researcher/researcher-info.component";
import { ExperimentalPlan } from "./experimental-plan";

@Component({
    selector: 'lab-experimental-plan-info',
    standalone: true,
    imports: [
        CommonModule,
        ExperimentalPlanResearcherInfoComponent
    ],
    template: `
        <h1>{{plan.title}} {{plan.fundingType}}</h1>

        <lab-experimental-plan-researcher-info 
            [plan]="plan">
        </lab-experimental-plan-researcher-info>

        <div class="process-summary">
            <p>{{plan.processSummary}}</p>
        </div>
    `
})
export class ExperimentalPlanInfoComponent {
    @Input()
    plan: ExperimentalPlan;

}