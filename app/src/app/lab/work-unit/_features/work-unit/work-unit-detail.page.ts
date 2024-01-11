import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subscription,
  defer,
  map,
  of,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { WorkUnitBaseInfoComponent } from '../../base-info/work-unit-base-info.component';
import {
  WorkUnit,
  WorkUnitCollection,
  WorkUnitContext,
  WorkUnitResourceContainerContext,
  WorkUnitService,
  injectWorkUnitService,
} from '../../common/work-unit';
import { injectModelService } from 'src/app/common/model/model-collection';
import { ResourceContainerContext } from 'src/app/lab/lab-resource/resource-container';
import { Resource } from 'src/app/lab/lab-resource/resource';
import {
  ALL_RESOURCE_TYPES,
  ResourceType,
} from 'src/app/lab/lab-resource/resource-type';
import { ResearchPlanFormPaneControl } from 'src/app/research/plan/common/research-plan-form-pane-control';

class WorkUnitContextError extends Error {}

function workUnitFromDetailRoute(): Observable<WorkUnit> {
  const workUnitService = injectWorkUnitService();

  function readByPlanAndIndex(index: string | number) {
    return workUnitService.fetch(`${index}`);
  }

  const models = inject(WorkUnitService);
  const activatedRoute = inject(ActivatedRoute);

  return activatedRoute.paramMap.pipe(
    switchMap((params) => {
      if (params.has('work_unit_index')) {
        return readByPlanAndIndex(params.get('work_unit_index')!);
      } else if (params.has('work_unit_id')) {
        return workUnitService.fetch(params.get('work_unit_id')!);
      } else {
        throw new Error(
          'Params must contain either work_unit_index or work_unit_id',
        );
      }
    }),
  );
}

@Component({
  selector: 'lab-work-unit-detail-page',
  template: `
    <button mat-button (click)="openUpdateForm()">
      <mat-icon>update</mat-icon>
    </button>

    @if (workUnit$ | async; as workUnit) {
      <div class="container">
        <lab-work-unit-base-info [workUnit]="workUnit">
        </lab-work-unit-base-info>

        <lab-work-unit-duration-info [workUnit]="workUnit" />
      </div>
    }

    <div class="resources">
      @for (resourceType of RESOURCE_TYPES; track resourceType) {
        <lab-work-unit-resource-card
          [resourceType]="resourceType"
          [resources]="(getResources(resourceType) | async) || []"
        >
        </lab-work-unit-resource-card>
      }
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
      }
      lab-work-unit-base-info {
        flex-grow: 1;
      }
      lab-work-unit-duration-info {
        flex-grow: 0;
        flex-shrink: 0;
      }
    `,
  ],
  providers: [
    WorkUnitContext,
    {
      provide: ResourceContainerContext,
      useClass: WorkUnitResourceContainerContext,
    },
  ],
})
export class WorkUnitDetailPage {
  readonly RESOURCE_TYPES = ALL_RESOURCE_TYPES;

  readonly _workUnitContext = inject(WorkUnitContext);
  readonly _workUnitContextConnection: Subscription;
  readonly workUnit$ = this._workUnitContext.workUnit$;

  readonly _formPane = inject(ResearchPlanFormPaneControl);

  constructor() {
    this._workUnitContextConnection = this._workUnitContext.sendCommitted(
      workUnitFromDetailRoute(),
    );
  }

  ngOnDestroy() {
    this._workUnitContextConnection.unsubscribe();
  }

  getResources<T extends Resource>(
    resourceType: ResourceType,
  ): Observable<readonly T[]> {
    return this.workUnit$.pipe(
      map((workUnit) => workUnit!.getResources<T>(resourceType)),
    );
  }

  openUpdateForm() {
    this.workUnit$
      .pipe(
        switchMap((workUnit) => {
          if (!workUnit) {
            throw new Error('Work unit detail has no work unit');
          }
          return this._formPane.open([
            'work-units',
            `${workUnit.index}`,
            'update',
          ]);
        }),
      )
      .subscribe();
  }
}
