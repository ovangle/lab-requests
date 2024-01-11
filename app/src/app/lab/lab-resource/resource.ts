import { Injectable, InjectionToken, forwardRef, inject } from '@angular/core';
import {
  Observable,
  ReplaySubject,
  Subscription,
  combineLatest,
  defer,
  filter,
  map,
  shareReplay,
} from 'rxjs';
import { ResourceType, isResourceType } from './resource-type';
import { ResourceFileAttachment } from './file-attachment/file-attachment';
import type {
  ResourceContainer,
  ResourceContainerContext,
} from './resource-container';
import { ResearchPlan } from 'src/app/research/plan/common/research-plan';

export interface ResourceParams {
  id: string | null;
  containerId: string;
  index: number | 'create';

  attachments?: ResourceFileAttachment[];
}

export class Resource<T extends ResourceParams = ResourceParams> {
  readonly type: ResourceType;

  readonly containerId: string;
  readonly index: number | 'create';
  readonly id: string;

  readonly attachments: ResourceFileAttachment<this>[];

  constructor(params: T) {
    if (!params.id) {
      throw new Error('No id in params');
    }
    this.id = params.id;

    this.containerId = params.containerId;
    this.index = params.index;
    this.attachments = params.attachments || [];
  }
}
export type ResourceTypeIndex = [ResourceType, number | 'create'];

export function isResourceTypeIndex(obj: any): obj is ResourceTypeIndex {
  return (
    Array.isArray(obj) &&
    obj.length == 2 &&
    isResourceType(obj[0]) &&
    (typeof obj[1] === 'number' || obj[1] === 'create')
  );
}

export const RESOURCE_CONTAINER_CONTEXT = new InjectionToken<
  ResourceContainerContext<any, any>
>('RESOURCE_CONTAINER_CONTEXT');

@Injectable()
export class ResourceContext<T extends Resource> {
  readonly _containerContext = inject(RESOURCE_CONTAINER_CONTEXT);
  readonly plan$: Observable<ResearchPlan> = this._containerContext.plan$;
  readonly container$: Observable<ResourceContainer> =
    this._containerContext.committed$;

  readonly containerName$ = this._containerContext.containerName$;
  readonly _committedTypeIndexSubject = new ReplaySubject<
    [ResourceType, number | 'create']
  >(1);
  readonly committedTypeIndex$ = this._committedTypeIndexSubject.asObservable();

  readonly resourceType$ = defer(() =>
    this.committedTypeIndex$.pipe(map(([type, _]) => type)),
  );
  readonly isCreate$ = defer(() =>
    this.committedTypeIndex$.pipe(map(([_, index]) => index === 'create')),
  );

  readonly committed$: Observable<T | null> = combineLatest([
    this.container$,
    this.committedTypeIndex$,
  ]).pipe(
    map(([container, typeIndex]: [ResourceContainer, ResourceTypeIndex]) => {
      const [resourceType, index] = typeIndex;

      return index === 'create'
        ? null
        : container.getResourceAt<T>(resourceType, index);
    }),
    shareReplay(1),
  );

  sendTypeIndex(typeIndex$: Observable<ResourceTypeIndex>): Subscription {
    typeIndex$.subscribe((typeIndex) =>
      this._committedTypeIndexSubject.next(typeIndex),
    );

    return new Subscription(() => {
      this._committedTypeIndexSubject.complete();
    });
  }
}
