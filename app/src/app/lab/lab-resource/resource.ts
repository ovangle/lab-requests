import { Injectable, InjectionToken, forwardRef, inject } from '@angular/core';
import { validate as validateIsUUID } from 'uuid';
import {
  Observable,
  ReplaySubject,
  Subscription,
  combineLatest,
  defer,
  filter,
  first,
  firstValueFrom,
  from,
  map,
  shareReplay,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { ResourceType, isResourceType } from './resource-type';
import {
  ResourceContainer,
  ResourceContainerContext,
} from './resource-container';
import { Model, ModelParams, modelParamsFromJsonObject } from 'src/app/common/model/model';
import { JsonObject } from 'src/app/utils/is-json-object';
import { RelatedModelService } from 'src/app/common/model/context';
import urlJoin from 'url-join';
import { ModelService } from 'src/app/common/model/model-service';
import { HttpParams } from '@angular/common/http';
import { DomElementSchemaRegistry } from '@angular/compiler';

export interface ResourceParams extends ModelParams {
  index: number;
}

export function resourceParamsFromJsonObject(json: JsonObject): ResourceParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (!isResourceType(json[ 'type' ])) {
    throw new Error("Expected a resource type 'resourceType'")
  }

  if (typeof json[ 'id' ] !== 'number') {
    throw new Error("Expected a stirng 'id'");
  }

  if (typeof json[ 'index' ] !== 'number') {
    throw new Error('Expected a number \'index\'');
  }

  if (typeof json[ 'labId' ] !== 'string' || !validateIsUUID(json[ 'labId' ])) {
    throw new Error("Expected a uuid 'labId'")
  }
  return {
    ...baseParams,
    index: json[ 'index' ],
  }
}

export abstract class Resource extends Model {
  abstract readonly type: ResourceType;

  readonly index: number;

  constructor(params: ResourceParams) {
    super(params);
    this.index = params.index;
  }
}

export interface ResourcePatch<T extends Resource> {

}

export abstract class ResourceService<T extends Resource, TPatch extends ResourcePatch<T> = ResourcePatch<T>> extends ModelService<T> {
  readonly containerContext = inject(ResourceContainerContext);
  abstract readonly resourceType: T[ 'type' ];

  abstract resourcePatchToJson(current: T | null, params: Partial<TPatch>): JsonObject;

  get indexUrl$(): Observable<string> {
    return this.containerContext.url$.pipe(
      map(url => urlJoin(url, 'resources', this.resourceType))
    )
  }

  modelUrl(resource: T) {
    return this.indexUrl$.pipe(
      first(),
      map(indexUrl => urlJoin(indexUrl, `${resource.id}`))
    );
  }

  protected override _doFetch(id: string): Observable<JsonObject> {
    return this.indexUrl$.pipe(
      first(),
      map(indexUrl => urlJoin(indexUrl, id)),
      switchMap(modelUrl => this._httpClient.get<JsonObject>(modelUrl + '/')),
    );
  }

  protected override _doQueryPage(params: HttpParams): Observable<JsonObject> {
    return this.indexUrl$.pipe(
      first(),
      switchMap(indexUrl => this._httpClient.get<JsonObject>(indexUrl, { params }))
    );
  }

  async getResourceAt(index: number): Promise<T> {
    const container = await firstValueFrom(this.containerContext.committed$);
    return container.getResourceAt(this.resourceType, index);
  }

  pushResource(patch: Partial<TPatch>): Observable<T> {
    return this.indexUrl$.pipe(
      first(),
      map(resourceIndex => urlJoin(resourceIndex, 'add')),
      switchMap(pushResourceUrl => this._httpClient.post<JsonObject>(
        pushResourceUrl,
        this.resourcePatchToJson(null, patch)
      )),
      map(created => this.modelFromJsonObject(created))
    )
  }

  update(resource: T, patch: Partial<TPatch>): Observable<T> {
    return this.modelUrl(resource).pipe(
      switchMap(([ replaceResourceUrl ]) => this._httpClient.post<JsonObject>(
        replaceResourceUrl,
        this.resourcePatchToJson(resource, patch)
      )),
      map(updated => this.modelFromJsonObject(updated))
    )
  }

  delete(resource: T): Observable<void> {
    return this.modelUrl(resource).pipe(
      switchMap(modelUrl => this._httpClient.delete<void>(modelUrl))
    )
  }
}

export type ResourceTypeIndex = [ ResourceType, number | 'create' ];

export function isResourceTypeIndex(obj: any): obj is ResourceTypeIndex {
  return (
    Array.isArray(obj) &&
    obj.length == 2 &&
    isResourceType(obj[ 0 ]) &&
    (typeof obj[ 1 ] === 'number' || obj[ 1 ] === 'create')
  );
}
