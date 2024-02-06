import { Injectable, InjectionToken, forwardRef, inject } from '@angular/core';
import { validate as validateIsUUID } from 'uuid';
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
import {
  ResourceContainer,
  ResourceContainerContext,
} from './resource-container';
import { ModelParams, modelParamsFromJsonObject } from 'src/app/common/model/model';
import { JsonObject } from 'src/app/utils/is-json-object';

export interface ResourceParams {
  index: number | 'create';
  type: ResourceType;
  id: string | null;
}

export function resourceParamsFromJsonObject(json: JsonObject): ResourceParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (typeof json[ 'index' ] !== 'number') {
    throw new Error('Expected a number \'index\'');
  }
  if (!isResourceType(json[ 'type' ])) {
    throw new Error("Expected a resource type 'resourceType'")
  }
  if (typeof json[ 'labId' ] !== 'string' || !validateIsUUID(json[ 'labId' ])) {
    throw new Error("Expected a uuid 'labId'")
  }
  return {
    ...baseParams,
    type: json[ 'type' ],
    index: json[ 'index' ],
  }
}

export class Resource {
  readonly type: ResourceType;

  readonly id: string | null;
  readonly index: number | 'create';

  constructor(params: ResourceParams) {
    this.id = params.id;
    this.type = params.type;

    this.index = params.index;
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

