import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Observable, map, firstValueFrom, defer, filter, tap, shareReplay } from "rxjs";
import { Campus, CampusPatch } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { LabType } from "../type/lab-type";
import { WorkUnitModelService, WorkUnitContext, WorkUnitPatch, WorkUnitPatchErrors, workUnitPatchFromWorkUnit } from "./work-unit";
import { ResourceContainerFormControls, resourceContainerFormControls } from "./resource/resource-container-form.service";

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | string | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    processSummary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

} & ResourceContainerFormControls>;

export function workUnitPatchFromForm(form: WorkUnitForm): WorkUnitPatch {
    if (!form.valid) {
        throw new Error('Cannot create patch from invalid form');
    }
    return form.value as WorkUnitPatch;
}

const errFields = ['campus', 'labType', 'technician', 'startDate', 'endDate'] as Array<keyof WorkUnitPatchErrors>
function workUnitPatchErrorsFromForm(form: WorkUnitForm): WorkUnitPatchErrors {
    function getControlErrors(key: keyof WorkUnitPatchErrors) {
        return form.controls[key].errors;
    }
    return Object.fromEntries(
        errFields.map(field => [field,  getControlErrors(field)])
    ) as unknown as WorkUnitPatchErrors;
}

export function workUnitForm(): WorkUnitForm {
    return new FormGroup({
        campus: new FormControl<Campus | string | null>(null, {validators: [Validators.required]}),
        labType: new FormControl<LabType | null>(null, {validators: [Validators.required]}),
        technician: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email
            ]
        }),
        processSummary: new FormControl('', {nonNullable: true}),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        ...resourceContainerFormControls()
    });

}

@Injectable()
export class WorkUnitFormService {
    readonly models = inject(WorkUnitModelService);
    readonly context: WorkUnitContext = inject(WorkUnitContext);

    readonly committed$ = this.context.committed$.pipe(
        tap((committed) => {
            console.log('committed 15', committed);
            this.form.reset();
            if (committed) {
                const patch = workUnitPatchFromWorkUnit(committed);
                this.form.patchValue(patch as any);
            }
        }),
        shareReplay(1)
    );

    readonly isCreate$ = defer(() => this.committed$.pipe(
        map(committed => committed == null)
    ));

    readonly form = new FormGroup({
        campus: new FormControl<Campus | string | null>(null, {validators: [Validators.required]}),
        labType: new FormControl<LabType | null>(null, {validators: [Validators.required]}),
        technician: new FormControl('', {
            nonNullable: true,
            validators: [
                Validators.required,
                Validators.email
            ]
        }),
        processSummary: new FormControl('', {nonNullable: true}),

        startDate: new FormControl<Date | null>(null),
        endDate: new FormControl<Date | null>(null),

        ...resourceContainerFormControls()
    });

    readonly patchValue$: Observable<WorkUnitPatch | null> = defer(() => this.form.valueChanges.pipe(
        filter(() => this.form.valid),
        map(() => {
            return workUnitPatchFromForm(this.form);
        })
    ));

    readonly formErrors$: Observable<WorkUnitPatchErrors | null> = this.form.statusChanges.pipe(
        map((status) => status === 'INVALID' ? this.form.errors as WorkUnitPatchErrors : null)
    )

    async save() {
        if (this.form.invalid) {
            throw new Error('Cannot patch: invalid form');
        }
        const isCreate = await firstValueFrom(this.isCreate$);
        console.log('isCreate', isCreate);
        const patch = workUnitPatchFromForm(this.form);
        if (isCreate) {
            return await this.context.create(patch!);
        } else { 
            return await this.context.commit(patch!);
        }
    }
}