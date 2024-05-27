import {
  Observable,
  first,
  firstValueFrom,
  map,
  switchMap,
} from 'rxjs';
import { inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import urlJoin from 'url-join';

import { Model, ModelParams, ModelRef, modelParamsFromJsonObject, resolveModelRef } from 'src/app/common/model/model';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

import { ModelService } from 'src/app/common/model/model-service';
import { Lab, LabService, labFromJsonObject } from '../lab';
import { LabResourceConsumerContext, } from '../lab-resource-consumer/resource-container';
import { ResourceType, isResourceType } from './resource-type';

export interface ResourceParams extends ModelParams {
  lab: Lab | string;
  index: number;
}

export function resourceParamsFromJsonObject(json: JsonObject): ResourceParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (!isResourceType(json[ 'type' ])) {
    throw new Error("Expected a resource type 'resourceType'")
  }

  let lab: Lab | string;
  if (isJsonObject(json[ 'lab' ])) {
    lab = labFromJsonObject(json[ 'lab' ]);
  } else if (typeof json[ 'lab' ] === 'string') {
    lab = json[ 'lab' ]
  } else {
    throw new Error("Expected a json object or string \'lab\'")
  }

  if (typeof json[ 'id' ] !== 'number') {
    throw new Error("Expected a stirng 'id'");
  }

  if (typeof json[ 'index' ] !== 'number') {
    throw new Error('Expected a number \'index\'');
  }

  return {
    ...baseParams,
    lab,
    index: json[ 'index' ],
  }
}

export abstract class Resource extends Model {
  abstract readonly type: ResourceType;

  readonly index: number;
  lab: ModelRef<Lab>;

  constructor(params: ResourceParams) {
    super(params);
    this.index = params.index;
    this.lab = params.lab;
  }

  async resolveLab(using: LabService): Promise<Lab> {
    if (typeof this.lab === 'string') {
      this.lab = await firstValueFrom(using.fetch(this.lab));
    }
    return this.lab;
  }

}

export interface ResourcePatch {
  lab: Lab;
}

export function resourcePatchToJsonObject(patch: ResourcePatch) {
  return {
    lab: patch.lab.id
  }
}

export abstract class ResourceService<T extends Resource, TPatch extends ResourcePatch = ResourcePatch> extends ModelService<T> {
  readonly consumerContext = inject(LabResourceConsumerContext);
  abstract readonly resourceType: T[ 'type' ];

  abstract patchToJsonObject(current: T | null, params: Partial<TPatch>): JsonObject;

  get indexUrl$(): Observable<string> {
    return this.consumerContext.url$.pipe(
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

  pushResource(patch: Partial<TPatch>): Observable<T> {
    return this.indexUrl$.pipe(
      first(),
      map(resourceIndex => urlJoin(resourceIndex, 'add')),
      switchMap(pushResourceUrl => this._httpClient.post<JsonObject>(
        pushResourceUrl,
        this.patchToJsonObject(null, patch)
      )),
      map(created => this.modelFromJsonObject(created))
    )
  }

  update(resource: T, patch: Partial<TPatch>): Observable<T> {
    return this.modelUrl(resource).pipe(
      switchMap(([ replaceResourceUrl ]) => this._httpClient.post<JsonObject>(
        replaceResourceUrl,
        this.patchToJsonObject(resource, patch)
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
