import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subscription, combineLatest, defer, map, of } from 'rxjs';

import { ResearchFunding } from 'src/app/research/funding/research-funding';
import {
  ResourceType,
  isResourceType,
} from 'src/app/lab/lab-resource/resource-type';
import { ResourceContext } from 'src/app/lab/lab-resource/resource';
import { ScaffoldFormPaneControl } from 'src/app/scaffold/form-pane/form-pane-control';
import { ResourceFormTitleComponent } from '../../lab-resource/common/resource-form-title.component';
import { EquipmentLeaseFormComponent } from '../equipment-lease/equipment-lease-form.component';
import { CommonModule } from '@angular/common';
import { InputMaterialFormComponent } from '../input-material/input-material-form.component';
import { SoftwareLeaseFormComponent } from '../software-lease/software-resource-form.component';
import { OutputMaterialFormComponent } from '../output-material/output-material-form.component';
import { FormGroup } from '@angular/forms';

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
    @if (_context.committedTypeIndex$ | async; as typeIndex) {
      <lab-resource-form-title
        [resourceType]="typeIndex[0]"
        [resourceIndex]="typeIndex[1]"
        [saveDisabled]="!_form?.valid"
        (requestClose)="close()"
        (requestSave)="saveAndClose()"
      >
      </lab-resource-form-title>

      @if (funding$ | async; as funding) {
        {{funding | json}}
        @switch (typeIndex[0]) {
          @case ('equipment-lease') {
            <lab-equipment-lease-form 
              [funding]="funding" />
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
  `,
  providers: [ ResourceContext ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabResourceFormPage {
  readonly _cd = inject(ChangeDetectorRef);
  readonly _context = inject(ResourceContext);
  _contextConnection: Subscription;

  readonly _formPane = inject(ScaffoldFormPaneControl);
  _form: FormGroup<any> | undefined;

  readonly typeIndex$ = defer(() => this._context.committedTypeIndex$);
  readonly resourceType$ = defer(() => this._context.resourceType$);

  readonly funding$: Observable<ResearchFunding | null> = this._context.funding$;

  constructor() {
    this._contextConnection = this._context.sendTypeIndex(
      typeIndexFromDetailRoute$(),
    );
  }

  attachForm(form: FormGroup<any>) {
    if (this._form) {
      throw new Error('resource form page can only have at most one resource form');
    }
    this._form = form;
  }

  ngOnDestroy() {
    this._contextConnection!.unsubscribe();
  }

  async close() {
    this._formPane.close();
  }
  async saveAndClose() {
    // await this._formService.save(patch);
    await this.close();
  }
}
