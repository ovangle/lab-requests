import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Observable, filter, map, startWith } from "rxjs";
import { Campus } from "src/app/uni/campus/common/campus";
import { Discipline } from "src/app/uni/discipline/discipline";
import { collectFieldErrors } from "src/app/utils/forms/validators";
import { LabType } from "../../type/lab-type";
import { ResourceContainerFormControls, ResourceContainerFormErrors, resourceContainerFormControls } from "../resource/resource-container-form.service";
import { WorkUnitPatch } from "./work-unit";

export type WorkUnitForm = FormGroup<{
    campus: FormControl<Campus | string | null>;
    labType: FormControl<Discipline | null>;
    technician: FormControl<string>;
    processSummary: FormControl<string>;

    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;

} & ResourceContainerFormControls>;

export function workUnitPatchFromForm(form: WorkUnitForm): Observable<WorkUnitPatch> {
    return form.valueChanges.pipe(
        startWith(form.value),
        takeUntilDestroyed(),
        filter((value: any): value is WorkUnitPatch => form.valid),
    );
}

export interface WorkUnitFormErrors extends ResourceContainerFormErrors {
    campus?: {
        notACampus?: string;
        required?: string;
    }
    labType?: {
        required?: string;
    }
    technician?: {
        required?: string;
        email?: string;
    }
    startDate?: {}
    endDate?: {}
}

export function workUnitFormErrors(form: WorkUnitForm): Observable<WorkUnitFormErrors | null> {
    return form.statusChanges.pipe(
        startWith(form.status),
        filter(status => status != 'PENDING'),
        map(() => form.errors as WorkUnitFormErrors)
    );
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
    }, {
        asyncValidators: [
            (control) => collectFieldErrors(control as WorkUnitForm)
        ]
    });

}
