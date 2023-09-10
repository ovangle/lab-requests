import { Component, Input } from "@angular/core";
import { ExperimentalPlan } from "../experimental-plan";
import { CommonModule } from "@angular/common";
import { CampusInfoComponent } from "src/app/uni/campus/campus-info.component";
import { Campus } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";


@Component({
    selector: 'lab-experimental-plan-researcher-info',
    standalone: true,
    imports: [
        CommonModule,

        CampusInfoComponent
    ],
    template: `
    <h4>{{email}}</h4>
    <dl>
        <dt>Base campus</dt>
        <dd><uni-campus-info [campus]="baseCampus"></uni-campus-info></dd>
        <dt>Discipline</dt>
        <dd>{{discipline}}</dd>
    </dl>
    `
})
export class ExperimentalPlanResearcherInfoComponent {
    @Input() plan: ExperimentalPlan;

    get email(): string {
        return this.plan.researcher;
    }

    get baseCampus(): Campus {
        return this.plan.researcherBaseCampus;
    }

    get discipline(): Discipline | null {
        return this.plan.researcherDiscipline;
    }

    get supervisorEmail(): string | null {
        return this.plan.supervisor;
    }
}