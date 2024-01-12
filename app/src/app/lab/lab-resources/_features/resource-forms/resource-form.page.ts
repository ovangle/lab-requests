import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, combineLatest, defer, map } from 'rxjs';

import { ResearchFunding } from 'src/app/research/funding/research-funding';
import {
  ResourceType,
  isResourceType,
} from 'src/app/lab/lab-resource/resource-type';
import { ResourceContext } from 'src/app/lab/lab-resource/resource';
import { ResourceContainer } from 'src/app/lab/lab-resource/resource-container';
import { ResourceFormService } from 'src/app/lab/lab-resource/resource-form.service';
import { ResearchPlanFormPaneControl } from 'src/app/research/plan/common/research-plan-form-pane-control';

export function typeIndexFromDetailRoute$(): Observable<
  [ ResourceType, number | 'create' ]
> {
  const activatedRoute = inject(ActivatedRoute);

  return combineLatest([ activatedRoute.paramMap, activatedRoute.data ]).pipe(
    map(([ paramMap, data ]) => {
      const resourceType = data[ 'resourceType' ];
      if (!isResourceType(resourceType)) {
        throw new Error('No resource type in route data');
      }
      let index: number | 'create' = Number.parseInt(
        paramMap.get('resource_index')!,
      );
      if (Number.isNaN(index)) {
        index = 'create';
      }
      return [ resourceType, index ];
    }),
  );
}

@Component({
  selector: 'lab-work-unit-resource-form-page',
  template: `
    @if (_formService.isReady | async; as typeIndex) {
      @if (containerName$ | async; as containerName) {
        <lab-resource-form-title
          [containerName]="containerName"
          [resourceType]="_formService.resourceType"
          [resourceIndex]="_formService.resourceIndex"
          [saveDisabled]="!_formService.form.valid"
          (requestClose)="close()"
          (requestSave)="saveAndClose()"
        >
        </lab-resource-form-title>
      }

      @if (containerId$ | async; as containerId) {
        @if (fundingModel$ | async; as fundingModel) {
          @switch (typeIndex[0]) {
            @case ('equipment-lease') {
              <lab-equipment-lease-form
                [workUnitId]="containerId"
                [fundingModel]="fundingModel"
              />
            }

            @case ('software-lease') {
              <lab-software-resource-form />
            }

            @case ('input-material') {
              <lab-input-material-resource-form />
            }

            @case ('output-material') {
              <lab-output-material-resource-form />
            }
          }
        }
      }
    }
  `,
  providers: [ ResourceContext, ResourceFormService ],
})
export class WorkUnitResourceFormPage {
  readonly _context = inject(ResourceContext);
  readonly _contextConnection: Subscription;

  readonly _formService = inject(ResourceFormService);
  readonly _formConnection: Subscription;

  readonly _formPane = inject(ResearchPlanFormPaneControl);

  readonly typeIndex$ = defer(() => this._context.committedTypeIndex$);
  readonly resourceType$ = defer(() => this._context.resourceType$);

  readonly containerId$: Observable<string> = this._context.container$.pipe(
    map((container: ResourceContainer) => container.id),
  );
  readonly containerName$: Observable<string> = this._context.container$.pipe(
    map((container: ResourceContainer) => '<container name>'),
  );

  readonly fundingModel$: Observable<ResearchFunding> =
    this._context.plan$.pipe(map((plan) => plan.funding));

  constructor() {
    this._contextConnection = this._context.sendTypeIndex(
      typeIndexFromDetailRoute$(),
    );
    this._formConnection = this._formService.connect();
  }

  ngOnDestroy() {
    this._contextConnection.unsubscribe();
    this._formConnection.unsubscribe();
  }

  async close() {
    this._formPane.close();
  }
  async saveAndClose() {
    await this._formService.save();
    await this.close();
  }
}
