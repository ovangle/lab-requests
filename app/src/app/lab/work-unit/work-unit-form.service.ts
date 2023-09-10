import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Observable, map, firstValueFrom } from "rxjs";
import { Campus } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { LabType } from "../type/lab-type";
import { ResourceContainerFormControls, resourceContainerFormControls } from "./resources/resource-container-form";
import { WorkUnitModelService, WorkUnitContext, WorkUnitPatch, WorkUnitPatchErrors } from "./work-unit";

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    summary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

} & ResourceContainerFormControls>;

@Injectable()
export class WorkUnitFormService {
    readonly models = inject(WorkUnitModelService);
    readonly context: WorkUnitContext = inject(WorkUnitContext);

    readonly form = new FormGroup({
        campus: new FormControl<Campus | null>(null, {validators: [Validators.required]}),
        labType: new FormControl<LabType | null>(null, {validators: [Validators.required]}),
        technician: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email
            ]
        }),
        summary: new FormControl('', {nonNullable: true}),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        ...resourceContainerFormControls()
    });

    readonly committed$ = this.context.committed$;

    readonly patch$: Observable<WorkUnitPatch | null> = this.form.statusChanges.pipe(
        map((status) => status === 'VALID' ? this.form.value as WorkUnitPatch : null)
    );

    readonly formErrors$: Observable<WorkUnitPatchErrors | null> = this.form.statusChanges.pipe(
        map((status) => status === 'INVALID' ? this.form.errors as WorkUnitPatchErrors : null)
    )

    async commit() {
        if (this.form.invalid) {
            throw new Error('Cannot patch: invalid form');
        }
        const patch = await firstValueFrom(this.patch$);
        return await this.context.commit(patch!);
    }
}