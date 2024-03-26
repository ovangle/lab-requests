import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, ReplaySubject, Subscription, combineLatest, defer, firstValueFrom, map, of, shareReplay, tap } from 'rxjs';

import { ResearchFunding } from 'src/app/research/funding/research-funding';
import {
  ResourceType,
  isResourceType,
} from 'src/app/lab/lab-resource/resource-type';
import { Resource, ResourceParams, ResourcePatch } from '../../lab-resource/resource';
import { ResourceContext } from '../../lab-resource/resource-context';
import { ScaffoldFormPaneControl } from 'src/app/scaffold/form-pane/form-pane-control';
import { ResourceFormTitleComponent } from '../../lab-resource/common/resource-form-title.component';
import { EquipmentLeaseFormComponent } from '../equipment-lease/equipment-lease-form.component';
import { CommonModule } from '@angular/common';
import { InputMaterialFormComponent } from '../input-material/input-material-form.component';
import { SoftwareLeaseFormComponent } from '../software-lease/software-resource-form.component';
import { OutputMaterialFormComponent } from '../output-material/output-material-form.component';
import { ResourceContainerContext, resourceContainerAttr } from '../../lab-resource/resource-container';
import { LabContext } from '../../lab-context';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EquipmentLeaseService } from '../equipment-lease/equipment-lease';

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
    @if (_context.committedTypeIndex$ | async; as typeIndex) {
      <lab-resource-form-title
        [resourceType]="typeIndex[0]"
        [resourceIndex]="typeIndex[1]"
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
  `,
  providers: [
    LabContext,
    ResourceContext
  ],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabResourceFormPage {
  readonly _cd = inject(ChangeDetectorRef);
  readonly _containerContext = inject(ResourceContainerContext);
  readonly _labContext = inject(LabContext);
  readonly _context = inject(ResourceContext);
  _contextConnection: Subscription;

  readonly _formPane = inject(ScaffoldFormPaneControl);

  readonly typeIndex$ = defer(() => this._context.committedTypeIndex$);
  readonly resourceType$ = defer(() => this._context.resourceType$).pipe(
    shareReplay(1)
  );

  readonly funding$ = this._context.funding$;

  readonly _patchSubject = new ReplaySubject<ResourcePatch<any>>(1);
  saveDisabled: boolean = true;

  constructor() {
    this._contextConnection = this._context.sendTypeIndex(
      typeIndexFromDetailRoute$(),
    );
    this._labContext.sendCommitted(this._context.lab$.pipe(
      takeUntilDestroyed()
    ));
  }

  ngOnDestroy() {
    this._contextConnection!.unsubscribe();
  }

  async close() {
    this._formPane.close();
  }
  async saveAndClose() {
    await this._containerContext.refresh();
    await this.close();
    /*
    const [ resourceType, index ] = await firstValueFrom(this._context.committedTypeIndex$);
    const resourcePatch = await firstValueFrom(this._patchSubject);

    if (index === 'create') {
      await this._containerContext.pushResource(resourceType, resourcePatch);
    } else {
      await this._containerContext.replaceResourceAt(resourceType, index, resourcePatch)
    }

    await this.close();
    */
  }

  onPatchChange<T extends Resource>(patch: Partial<ResourcePatch<T>>) {
    this._patchSubject.next(patch);
  }
  onFormHasError(hasError: boolean) {
    this.saveDisabled = !hasError;
  }
}
