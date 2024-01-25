import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Subscription,
  filter,
  first,
  firstValueFrom,
  map,
  switchMap,
  tap,
} from 'rxjs';

import {
  Resource,
  ResourceContext,
  ResourceTypeIndex,
  isResourceTypeIndex,
} from './resource';
import { ResourceContainerFormService } from './resource-container-form.service';
import { ResourceContainer } from './resource-container';

@Injectable()
export class ResourceFormService<
  T extends Resource,
  TForm extends FormGroup<any>,
> {
  readonly resourceContext = inject(ResourceContext<T>);
  readonly containerFormService = inject(ResourceContainerFormService);

  readonly _typeIndexSubject = new BehaviorSubject<
    ResourceTypeIndex | undefined
  >(undefined);

  readonly isReady: Promise<ResourceTypeIndex> = firstValueFrom(
    this.resourceContext.committedTypeIndex$.pipe(
      tap((typeIndex) => this._typeIndexSubject.next(typeIndex)),
      filter(isResourceTypeIndex),
      tap(([ resourceType, index ]) => {
        this.containerFormService.initResourceForm(resourceType, index);
      }),
    ),
  ).then((typeIndex) => typeIndex);

  get _typeIndex(): ResourceTypeIndex {
    if (this._typeIndexSubject.value === undefined) {
      throw new Error('Cannot access type and index.');
    }
    return this._typeIndexSubject.value;
  }

  get resourceType() {
    return this._typeIndex[ 0 ];
  }

  get resourceIndex() {
    return this._typeIndex[ 1 ];
  }

  get form(): TForm {
    const [ resourceType, index ] = this._typeIndex;
    const form = this.containerFormService.getResourceForm(resourceType, index);
    if (form == null) {
      throw new Error('Resource form not initialized');
    }
    return form as TForm;
  }

  get isCreate(): boolean {
    const [ resourceType, index ] = this._typeIndex;
    return index === 'create';
  }

  async save(): Promise<T> {
    const [ resourceType, index ] = this._typeIndex;
    throw new Error('NotImplemented');
    /*
    const container: ResourceContainer = await this.containerFormService.commit();
    if (index === 'create') {
      const resources = container.getResources<T>(resourceType);
      return resources[ resources.length - 1 ];
    }
    return container.getResourceAt<T>(resourceType, index);
    */
  }

  connect(): Subscription {
    return new Subscription(() => {
      this._typeIndexSubject.complete();

      const [ resourceType, index ] = this._typeIndex;
      return this.containerFormService.clearResourceForm(resourceType, index);
    });
  }
}
