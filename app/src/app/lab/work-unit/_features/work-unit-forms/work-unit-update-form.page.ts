import { Component, inject } from "@angular/core";
import { WorkUnit, WorkUnitContext, workUnitPatchFromWorkUnit } from "../../work-unit";
import { workUnitForm } from "../../work-unit-form";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";


@Component({
    selector: 'lab-work-unit-update-form-page',
    template: `
    <lab-work-unit-base-info-form [form]="form" />
    `
})
export class WorkUnitUpdateFormPage {
    readonly _workUnitContext = inject(WorkUnitContext);
    readonly workUnit$ = this._workUnitContext.workUnit$;

    readonly form = workUnitForm();

    constructor() {
        this.workUnit$.pipe(
            takeUntilDestroyed()
        ).subscribe((workUnit: WorkUnit | null) => {
            if (!workUnit) {
                throw new Error('Update form page expects a work unit');
            }
            const patch = workUnitPatchFromWorkUnit(workUnit);
            this.form.patchValue(patch);
        })
    }
}