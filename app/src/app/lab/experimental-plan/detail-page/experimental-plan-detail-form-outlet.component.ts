import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ExperimentalPlanModule } from "../experimental-plan.module";


@Component({
    selector: 'lab-experimental-plan-detail-form-outlet',
    standalone: true,
    imports: [
        CommonModule,
        ExperimentalPlanModule
    ],
    template: `
        <router-outlet name="forms"></router-outlet>
    `,
    styles: [`
    `]
})
export class ExperimentalPlanDetailFormOutlet {

}