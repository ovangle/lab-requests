import { Injectable, inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Observable, map, firstValueFrom, defer, filter, tap, shareReplay, of, first, startWith, forkJoin } from "rxjs";
import { Campus, CampusPatch } from "src/app/uni/campus/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { LabType } from "../type/lab-type";
import { WorkUnitModelService, WorkUnitContext, WorkUnitPatch, workUnitPatchFromWorkUnit } from "./work-unit";
import { ResourceContainerFormControls, resourceContainerFormControls } from "./resource/resource-container-form.service";
import { ResourceContainerPatchErrors } from "./resource/resource-container";
import { V } from "@angular/cdk/keycodes";

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

export interface WorkUnitFormErrors extends ResourceContainerPatchErrors {
    campus: {
        required: string | null;
    } | null;
    labType: {
        required: string | null;
    } | null; 
    technician: {
        required: string | null;
        email: string | null;
    } | null;
    startDate: {
        afterToday: string | null;
    } | null;
    endDate: {
        afterStartDate: string | null;
    } | null;
}

type ErrKey = keyof WorkUnitForm['controls'] & keyof WorkUnitFormErrors;
const BASE_ERR_FIELDS: ErrKey[] = ['campus', 'labType', 'technician', 'startDate', 'endDate'];

export function workUnitForm(): WorkUnitForm {
    function getErrors<K extends ErrKey>(form: WorkUnitForm, key: K): WorkUnitFormErrors[K] {
        const control = form.controls[key];
        if (control.status == 'PENDING') {
            return control.statusChanges.pipe(
                filter(status => status != 'PENDING'),
                map(() => control.errors as WorkUnitFormErrors[K]),
                first(),
            )
        }
        return of(control.errors as WorkUnitFormErrors[K]);
    }

    function collectErrors(form: WorkUnitForm): Observable<WorkUnitFormErrors | null> {
        const fieldErrors: Observable<any>[] = BASE_ERR_FIELDS.map((k) => getErrors(form, k))
        return forkJoin(fieldErrors).pipe(
            map(results => {
                if (results.every(item => item == null)) {
                    return null;
                }
                return Object.fromEntries(
                    BASE_ERR_FIELDS.map((k, i) => [k, results[i]])
                ) as WorkUnitFormErrors;
            })
        );
    }

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
    }, {
        asyncValidators: [(c) => collectErrors(c as WorkUnitForm)]
    });

}

export function workUnitFormErrors(form: WorkUnitForm): WorkUnitFormErrors | null {
    if (form.status === 'PENDING') {
        console.warn('WORK UNIT FORM PENDING');
    }
    return form.errors as WorkUnitFormErrors | null;
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

    readonly formErrors$: Observable<WorkUnitFormErrors | null> = this.form.statusChanges.pipe(
        map((status) => status === 'INVALID' ? this.form.errors as WorkUnitFormErrors : null)
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