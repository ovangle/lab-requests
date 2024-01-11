import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { WorkUnitContext } from '../../common/work-unit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResearchPlanContext } from 'src/app/research/plan/common/research-plan';

function workUnitContextFromFormHostRoute() {
  const planContext = inject(ResearchPlanContext);
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

  return combineLatest([planContext.committed$, workUnitIndex$]).pipe(
    takeUntilDestroyed(),
    map(([plan, workUnitIndex]) => {
      throw new Error('not implemented');
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
