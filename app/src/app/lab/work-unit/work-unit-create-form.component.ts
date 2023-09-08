import { Component, Injectable, inject } from "@angular/core";
import { ExperimentalPlanContext } from "../experimental-plan";
import { Subscription, map } from "rxjs";

import { WorkUnitFormComponent, WorkUnitPatchFormService } from "./work-unit-patch-form.component";
import { CommonModule } from "@angular/common";
import { WorkUnitContext } from "./work-unit";
import { Validators } from "@angular/forms";

@Injectable()
export class WorkUnitCreateFormService {
    readonly planContext = inject(ExperimentalPlanContext);
    readonly patchFormService = inject(WorkUnitPatchFormService)

    readonly form = this.patchFormService.form;
    readonly patch$ = this.patchFormService.patch$;
    readonly formErrors$ = this.patchFormService.formErrors$;
}


@Component({
    selector: 'app-work-unit-create-form',
    standalone: true,
    imports: [
        CommonModule,
        WorkUnitFormComponent
    ],
    template: `
    <form [formGroup]="form"
    `


})
export class WorkUnitCreateFormComponent {
    readonly planContext = inject(ExperimentalPlanContext);

    readonly planIdFromContext$ = this.planContext.pipe(
        map(plan => plan && plan.id)
    );

}