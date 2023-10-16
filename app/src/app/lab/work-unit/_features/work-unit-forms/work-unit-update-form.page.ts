import { AfterViewInit, Component, OnDestroy, inject } from "@angular/core";
import { workUnitForm } from "../../common/work-unit-form";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { WorkUnitContext, WorkUnit, workUnitPatchFromWorkUnit } from "../../common/work-unit";

/**
 * Updates the basic info of a work unit.
 */
@Component({
    selector: 'lab-work-unit-update-form-page',
    template: `
    <lab-work-unit-form-title
        [saveDisabled]="!form.valid"
        (requestSave)="_onRequestSave()"
        (requestClose)="_onRequestClose()">
        Update work unit
    </lab-work-unit-form-title>
    <lab-work-unit-base-info-form [form]="form" />
    `,
    host: {
        'class': 'mat-elevation-z8'
    },
    styleUrls: [
        './work-unit-form.css'
    ]
})
export class WorkUnitUpdateFormPage implements AfterViewInit, OnDestroy {
    readonly _workUnitContext = inject(WorkUnitContext);
    readonly workUnit$ = this._workUnitContext.workUnit$;

    readonly _formPane = inject(ExperimentalPlanFormPaneControlService);
    readonly appScaffold = inject(BodyScrollbarHidingService);

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

    ngAfterViewInit() {
        this.appScaffold.hideScrollbar();
    }

    ngOnDestroy() {
        this.appScaffold.unhideScrollbar();
    }

    async _onRequestSave() {
        await this.close();
    }

    async _onRequestClose() {
        await this.close();
    }

    async close() {
        return await this._formPane.close();
    }
}