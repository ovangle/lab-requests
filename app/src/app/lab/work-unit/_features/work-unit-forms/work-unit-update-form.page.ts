import { AfterViewInit, Component, OnDestroy, inject } from '@angular/core';
import {
  workUnitForm,
  workUnitPatchFromForm,
} from '../../common/work-unit-form';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExperimentalPlanFormPaneControlService } from 'src/app/lab/experimental-plan/experimental-plan-form-pane-control.service';
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  WorkUnitContext,
  WorkUnit,
  workUnitPatchFromWorkUnit,
  formatWorkUnit,
} from '../../common/work-unit';
import { defer, map } from 'rxjs';

/**
 * Updates the basic info of a work unit.
 */
@Component({
  selector: 'lab-work-unit-update-form-page',
  template: `
    @if (workUnit$ | async; as workUnit) {
      <lab-work-unit-form-title
        [workUnitName]="workUnit.name"
        formType="update"
        [saveDisabled]="!form.valid"
        (requestSave)="_onRequestSave()"
        (requestClose)="_onRequestClose()"
      />
    }
    <lab-work-unit-form [form]="form" [fixedFields]="['campus', 'labType']" />
  `,
  host: {
    class: 'mat-elevation-z8',
  },
  styleUrls: ['./work-unit-form.css'],
})
export class WorkUnitUpdateFormPage {
  readonly _workUnitContext = inject(WorkUnitContext);
  readonly workUnit$ = this._workUnitContext.workUnit$;

  readonly _formPane = inject(ExperimentalPlanFormPaneControlService);

  readonly form = workUnitForm();

  constructor() {
    this.workUnit$
      .pipe(takeUntilDestroyed())
      .subscribe((workUnit: WorkUnit | null) => {
        if (!workUnit) {
          throw new Error('Update form page expects a work unit');
        }
        const patch = workUnitPatchFromWorkUnit(workUnit);
        this.form.patchValue(patch);
      });
  }

  async _onRequestSave() {
    const patch = workUnitPatchFromForm(this.form);
    await this._workUnitContext.commit(patch);
    await this.close();
  }

  async _onRequestClose() {
    await this.close();
  }

  async close() {
    return await this._formPane.close();
  }

  _displayWorkUnit(workUnit: WorkUnit) {
    return formatWorkUnit(workUnit);
  }
}
