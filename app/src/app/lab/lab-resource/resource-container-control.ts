import { v4 as uuid } from 'uuid';
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, ReplaySubject, firstValueFrom } from 'rxjs';
import {
  ResourceContainer,
  ResourceContainerPatch,
} from './resource-container';
import { ResearchFunding } from 'src/app/research/funding/research-funding';


/**
 * Used to control the current research container in the context.
 */
export class ResourceContainerControl {
  _committedSubject = new BehaviorSubject<ResourceContainer>(new ResourceContainer({
    equipments: [],
    softwares: [],
    inputMaterials: [],
    outputMaterials: [],
  }));
  readonly committed$ = this._committedSubject.asObservable();
  _fundingSubject = new ReplaySubject<ResearchFunding>(1);
  readonly funding$ = this._fundingSubject.asObservable();

  _onCommit: (patch: ResourceContainerPatch) => void;

  constructor(
    container: ResourceContainer | null,
    funding: Observable<ResearchFunding>,
    onCommit: (patch: ResourceContainerPatch) => void
  ) {
    if (container) {
      this._committedSubject.next(container);
    }
    funding.subscribe(this._fundingSubject);
    this._onCommit = onCommit;
  }

  commit(patch: ResourceContainerPatch): Promise<ResourceContainer> {
    const committed = this._committedSubject.value;
    this._committedSubject.next(committed.apply(patch));
    this._onCommit(patch);
    return firstValueFrom(this._committedSubject);
  }
}
