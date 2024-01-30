import { Injectable, inject } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
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
import { ResourceContainerContext } from './resource-container';

@Injectable()
export class ResourceFormService<
  T extends Resource,
  TForm extends FormGroup<any>,
> {
  readonly containerContext = inject(ResourceContainerContext);
  readonly resourceContext = inject(ResourceContext<T>);

  readonly _typeIndexSubject = new ReplaySubject<ResourceTypeIndex>(1);

  readonly typeIndex$: Observable<ResourceTypeIndex> =
    this.resourceContext.committedTypeIndex$.pipe(
      tap((typeIndex) => {
        console.log('typeIndex', typeIndex);
        this._typeIndexSubject.next(typeIndex)
      }),
      filter(isResourceTypeIndex),
      tap(([ resourceType, index ]) => {
        this.containerContext.control.initResourceForm(resourceType, index);
      }),
    );

  async form(): Promise<TForm> {
    const [ resourceType, index ] = await firstValueFrom(this.typeIndex$);
    const form = this.containerContext.control.getResourceForm(resourceType, index);
    if (form == null) {
      throw new Error('Resource form not initialized');
    }
    return form as TForm;
  }

  async save(): Promise<T> {
    const [ resourceType, index ] = await firstValueFrom(this.typeIndex$);
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
}
