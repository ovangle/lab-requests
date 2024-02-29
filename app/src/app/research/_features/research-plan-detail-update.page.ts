import { Component, inject } from "@angular/core";
import { ResearchPlanContext } from "../plan/research-plan";


@Component({
    standalone: true,
    imports: [

    ],
    template: ``
})
export class ResearchPlanDetail__UpdatePage {
    readonly context = inject(ResearchPlanContext);

}