import { Injectable, inject } from '@angular/core';
import {
  WorkUnit,
  WorkUnitLookup,
  WorkUnitMeta,
  WorkUnitPatch,
} from '../../work-unit/common/work-unit';
import { ModelService } from 'src/app/common/model/model-service';
import { Observable, map, switchMap, take } from 'rxjs';
import { ModelMeta, ModelResponsePage } from 'src/app/common/model/model';
import {
  ExperimentalPlan,
  ExperimentalPlanContext,
} from '../common/experimental-plan';

@Injectable()
export class ExperimentalPlanWorkUnitService extends ModelService<
  WorkUnit,
  WorkUnitPatch,
  WorkUnitLookup
> {
  override readonly metadata = new WorkUnitMeta();
  readonly planContext = inject(ExperimentalPlanContext);

  readonly plan$: Observable<ExperimentalPlan> = this.planContext.plan$;

  readonly resourcePath$ = this.plan$.pipe(
    map((plan) => `/lab/plan/${plan.id}/work-units`),
  );

  override fetch(id: string | number): Observable<WorkUnit> {
    const index = typeof id === 'string' ? Number.parseInt(id) : id;
    return this.plan$.pipe(
      take(1),
      map((plan) => {
        if (0 <= index && index < plan.workUnits.length) {
          return plan.workUnits[index];
        }
        throw new Error(`Index ${index} out of range`);
      }),
    );
  }

  override queryPage(
    lookup: Partial<WorkUnitLookup>,
  ): Observable<ModelResponsePage<WorkUnit, WorkUnitLookup>> {
    const params = this.lookupToHttpParams(lookup);
    return this.resourcePath$.pipe(
      take(1),
      switchMap((path) => this._httpClient.get(path, { params })),
      map(this.responsePageFromJson(lookup)),
    );
  }
  override create(patch: WorkUnitPatch): Observable<WorkUnit> {
    throw new Error('Method not implemented.');
  }
  override update(id: string, params: WorkUnitPatch): Observable<WorkUnit> {
    throw new Error('Method not implemented.');
  }
}
