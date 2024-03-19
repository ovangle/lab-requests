import { Component, inject } from "@angular/core";
import { LabResourceContainerFormComponent } from "src/app/lab/lab-resource/resource-container-form.component";
import { ResearchPlanContext } from "../plan/research-plan-context";
import { ResourceContainerControl } from "src/app/lab/lab-resource/resource-container-control";
import { firstValueFrom } from "rxjs";
import { ResearchPlan, ResearchPlanService } from "../plan/research-plan";

@Component({
    standalone: true,
    imports: [
        LabResourceContainerFormComponent
    ],
    template: `
    <lab-resource-container-form
        [containerControl]="containerControl" />
    `

})
export class ResearchPlanDetail__RequirementsPage {
    _context = inject(ResearchPlanContext);
    _service = inject(ResearchPlanService);

    readonly plan$ = this._context.committed$;

    readonly containerControl = new ResourceContainerControl<ResearchPlan>(
        this._context,
        async (patch) => {
            const committed = await firstValueFrom(this.plan$);
            return await firstValueFrom(this._service.update(committed, patch));
        }
    )

}