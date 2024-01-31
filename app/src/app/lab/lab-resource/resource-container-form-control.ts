import { v4 as uuid } from 'uuid';
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { Resource } from './resource';
import {
  ResourceContainer,
  ResourceContainerPatch,
} from './resource-container';
import { ResourceType } from './resource-type';






export type GetResourceAtFn<T extends Resource> = (resourceType: T[ 'type' ], index: number) => T | undefined;

/**
 * Root service so that resource create/update forms (which display in the scaffold form pane)
 * equipments, softwares, inputMaterials and outputMaterials.
 */
export class ResourceContainerControl {
  _committedSubject = new BehaviorSubject<ResourceContainer>(new ResourceContainer({
    funding: null,
    equipments: [],
    softwares: [],
    inputMaterials: [],
    outputMaterials: [],
  }));
  readonly committed$ = this._committedSubject.asObservable();
  _onCommit = new Subject<ResourceContainerPatch>();

  constructor(
    container: ResourceContainer | null,
    onCommit: (patch: ResourceContainerPatch) => void
  ) {
    if (container) {
      this._committedSubject.next(container);
    }
    this._onCommit.subscribe(onCommit);
  }

  commit(patch: ResourceContainerPatch): Promise<ResourceContainer> {
    const committed = this._committedSubject.value;
    this._committedSubject.next(committed.apply(patch));
    return firstValueFrom(this._committedSubject);
  }
}
