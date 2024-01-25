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
import { ScaffoldFormPaneControl } from 'src/app/scaffold/form-pane/form-pane-control';
import { ResourceFormTitleComponent } from '../../lab-resource/common/resource-form-title.component';
import { EquipmentLeaseFormComponent } from '../equipment-lease/equipment-lease-form.component';
import { CommonModule } from '@angular/common';
import { InputMaterialFormComponent } from '../input-material/input-material-resource-form.component';
import { SoftwareLeaseFormComponent } from '../software-lease/software-resource-form.component';
import { OutputMaterialFormComponent } from '../output-material/output-material-resource-form.component';

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
  standalone: true,
  imports: [
    CommonModule,
    ResourceFormTitleComponent,
    EquipmentLeaseFormComponent,
    InputMaterialFormComponent,
    SoftwareLeaseFormComponent,
    OutputMaterialFormComponent
  ],
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
              <lab-software-lease-form />
            }

            @case ('input-material') {
              <lab-input-material-form />
            }

            @case ('output-material') {
              <lab-output-material-form />
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

  readonly _formPane = inject(ScaffoldFormPaneControl);

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
