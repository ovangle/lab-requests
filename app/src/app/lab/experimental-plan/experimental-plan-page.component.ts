import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { ExperimentalPlanContext } from "./experimental-plan";


@Component({
    selector: 'app-lab-experimental-plan-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    template: `
        <router-outlet></router-outlet>
    `,
    providers: [
        ExperimentalPlanContext
    ]
})
export class ExperimentalPlanPageComponent {

}