import { v4 as uuid } from 'uuid';
import { FormArray, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, ReplaySubject, defer, firstValueFrom, map } from 'rxjs';
import {
  ResourceContainer,
  ResourceContainerPatch,
} from './resource-container';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { ModelContext } from 'src/app/common/model/context';


/**
 * Used to control the current research container in the context.
 */
export class ResourceContainerControl<T extends ResourceContainer> {
  context: ModelContext<T>;
  readonly container$ = defer(() => this.context.committed$);
  _saveContainer: (patch: ResourceContainerPatch) => Promise<T>

  readonly funding$ = this.container$.pipe(
    map(container => container.funding)
  );

  constructor(
    context: ModelContext<T>,
    saveContainer: (patch: ResourceContainerPatch) => Promise<T>
  ) {
    this.context = context;
    this._saveContainer = saveContainer;
  }

  async commit(patch: ResourceContainerPatch): Promise<T> {
    return await this._saveContainer(patch);
  }
}
