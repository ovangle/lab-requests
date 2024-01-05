import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { ExperimentalPlanContext } from 'src/app/lab/experimental-plan/common/experimental-plan';
import { WorkUnitContext } from '../../common/work-unit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

function workUnitContextFromFormHostRoute() {
  const planContext = inject(ExperimentalPlanContext);
  const activatedRoute = inject(ActivatedRoute);

  const workUnitIndex$ = activatedRoute.paramMap.pipe(
    map((paramMap) => {
      const workUnitIndex = Number.parseInt(paramMap.get('work_unit_index')!);
      if (Number.isNaN(workUnitIndex)) {
        throw new Error('no :work_unit_index in route');
      }
      return workUnitIndex;
    }),
  );

  return combineLatest([planContext.plan$, workUnitIndex$]).pipe(
    takeUntilDestroyed(),
    map(([plan, workUnitIndex]) => {
      if (workUnitIndex < 0 || workUnitIndex >= plan.workUnits.length) {
        throw new Error(':work_unit_index param out of range');
      }
      return plan.workUnits[workUnitIndex];
    }),
  );
}

@Component({
  selector: 'lab-work-unit-context-host-page',
  template: ` <router-outlet></router-outlet> `,
  providers: [WorkUnitContext],
})
export class WorkUnitContextHostPage {
  readonly _workUnitContext = inject(WorkUnitContext);

  constructor() {
    this._workUnitContext.sendCommitted(workUnitContextFromFormHostRoute());
  }
}
