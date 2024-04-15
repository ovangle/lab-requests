import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Provider, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, ReplaySubject, Subscription, combineLatest, defer, firstValueFrom, map, of, shareReplay, tap } from 'rxjs';

import { ResearchFunding } from 'src/app/research/funding/research-funding';
import {
  ResourceType,
  isResourceType,
} from 'src/app/lab/lab-resource/resource-type';
import { ResourceContext } from '../lab-resource/resource-context';
import { ScaffoldFormPaneControl } from 'src/app/scaffold/form-pane/form-pane-control';
import { Resource, ResourceParams, ResourcePatch } from '../lab-resource/resource';
import { ResourceFormTitleComponent } from '../lab-resource/common/resource-form-title.component';
import { EquipmentLeaseFormComponent } from '../lab-resource/types/equipment-lease/equipment-lease-form.component';
import { InputMaterialFormComponent } from '../lab-resource/types/input-material/input-material-form.component';
import { SoftwareLeaseFormComponent } from '../lab-resource/types/software-lease/software-resource-form.component';
import { OutputMaterialFormComponent } from '../lab-resource/types/output-material/output-material-form.component';
import { LabResourceContainerContext, resourceTypeFromActivatedRoute } from '../lab-resource-consumer/resource-container';
import { LabContext } from '../lab-context';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentLeaseService } from '../lab-resource/types/equipment-lease/equipment-lease';


export function resourceIndexFromRoute(): Observable<number | 'create'> {
  const activatedRoute = inject(ActivatedRoute);
  return activatedRoute.paramMap.pipe(
    map((paramMap) => {
      const index = paramMap.get('resource_index');
      if (index === 'create') {
        return index;
      } else if (index === null) {
        throw new Error('No index in route');
      }
      const numIndex = +index;
      if (Number.isNaN(numIndex)) {
        throw new Error('No index in route')
      }
      return numIndex;
    })
  )
}

@Component({
  selector: 'lab-resource-form-page',
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
    @if (_context.resourceType$ | async; as resourceType) {
      @if (_context.currentIndex$ | async; as currentIndex) {
      <lab-resource-form-title
        [resourceType]="resourceType"
        [resourceIndex]="currentIndex"
        [saveDisabled]="saveDisabled"
        (requestClose)="close()"
        (requestSave)="saveAndClose()"
      >
      </lab-resource-form-title>
    
      @switch (resourceType$ | async) {
        @case ('equipment-lease') {
          <lab-equipment-lease-form 
              [funding]="funding$ | async" 
              (patchChange)="onPatchChange($event)"
              (hasError)="onFormHasError($event)"/>
        }

        @case ('software-lease') {
          <lab-software-lease-form 
              (patchChange)="onPatchChange($event)"
              (hasError)="onFormHasError($event)"/>
        }

        @case ('input-material') {
          <lab-input-material-form 
              (patchChange)="onPatchChange($event)"
              (hasError)="onFormHasError($event)"/>
        }

        @case ('output-material') {
          <lab-output-material-form 
              (patchChange)="onPatchChange($event)"
              (hasError)="onFormHasError($event)" />
        }

        @default {
          No type index specified
        }
      }
    }
  }
  `,
  providers: [
    LabContext,
    LabResourceContainerContext,
    ResourceContext
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabResourceFormPage {
  readonly _cd = inject(ChangeDetectorRef);
  readonly _labContext = inject(LabContext);
  readonly _containerContext = inject(LabResourceContainerContext);
  readonly _context = inject(ResourceContext);

  readonly _formPane = inject(ScaffoldFormPaneControl);

  readonly resourceType$ = this._context.resourceType$;

  readonly funding$ = this._context.funding$;

  readonly _patchSubject = new ReplaySubject<ResourcePatch<any>>(1);
  saveDisabled: boolean = true;

  constructor() {
    this._containerContext.observeContainerType(resourceTypeFromActivatedRoute())
    this._labContext.sendCommitted(this._context.lab$.pipe(
      takeUntilDestroyed()
    ));
  }

  async saveAndClose() {

  }

  async close() {
    this._formPane.close();
  }

  onPatchChange<T extends Resource>(patch: Partial<ResourcePatch<T>>) {
    this._patchSubject.next(patch);
  }
  onFormHasError(hasError: boolean) {
    this.saveDisabled = !hasError;
  }
}
