import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ExperimentalPlan } from "./experimental-plan";

@Component({
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    <h3>{{plan.title}}</h3>
    <div class="researcher">
        <lab-experiemntal-plan-researcher-info [plan]="plan">
    </div>

    <p>{{plan.processSummary}}</p>
    `
})
export class ExperimentalPlanInfoComponent {
    @Input()
    plan: ExperimentalPlan;

}