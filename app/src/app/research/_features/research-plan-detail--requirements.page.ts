import { Component, inject } from "@angular/core";
import { LabResourceContainerFormComponent } from "src/app/lab/lab-resource/resource-container-form.component";
import { ResearchPlanContext } from "../plan/research-plan-context";
import { firstValueFrom } from "rxjs";
import { ResearchPlan, ResearchPlanService } from "../plan/research-plan";

@Component({
    standalone: true,
    imports: [
        LabResourceContainerFormComponent
    ],
    template: `
    <lab-resource-container-form
        [modelContext]="_context" />
    `

})
export class ResearchPlanDetail__RequirementsPage {
    _context = inject(ResearchPlanContext);
    _service = inject(ResearchPlanService);

    readonly plan$ = this._context.committed$;
}