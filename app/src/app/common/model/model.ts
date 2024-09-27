import { Type, inject } from '@angular/core';
import { parseISO } from 'date-fns';
import { validate as validateIsUUID } from 'uuid';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelService } from './model-service';
import { Connectable, Observable, ReplaySubject, connectable, firstValueFrom, of, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export abstract class Model {
  readonly id: string;

  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(json: JsonObject) {
    if (typeof json['id'] !== 'string') {
      throw new Error("Expected a string 'id'");
    }
    this.id = json['id']

    if (typeof json['createdAt'] !== 'string') {
      throw new Error("Expected string 'createdAt'");
    }
    this.createdAt = parseISO(json['createdAt']);

    if (typeof json['updatedAt'] !== 'string') {
      throw new Error("Expected string 'createdAt'");
    }
    this.updatedAt = parseISO(json['updatedAt']);
  }
}

export type ModelFactory<T extends Model> = {
  new(json: JsonObject): T;
}

export interface ModelIndexPage<T extends Model> {
  readonly items: T[];

  readonly totalItemCount: number;
  readonly totalPageCount: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export function modelIndexPageFromJsonObject<T extends Model>(
  propKey: string,
  modelFactory: ModelFactory<T>,
  json: JsonObject
): ModelIndexPage<T>;
export function modelIndexPageFromJsonObject<T extends Model>(
  modelFactory: ModelFactory<T>,
  json: JsonObject
): ModelIndexPage<T>;

export function modelIndexPageFromJsonObject<T extends Model>(
  propKeyOrFactory: ModelFactory<T> | string,
  modelFactoryOrJson: ModelFactory<T> | JsonObject,
  maybeJson?: JsonObject,
): ModelIndexPage<T> {
  let modelFactory: ModelFactory<T>;
  let json: JsonObject;

  if (typeof propKeyOrFactory === 'string') {
    const propKey = propKeyOrFactory;
    if (maybeJson === undefined) {
      throw new Error('Json argument must be provided');
    }
    const v = maybeJson[propKey]
    if (!isJsonObject(v)) {
      throw new Error(`Expected an object '${propKey}'`)
    }
    modelFactory = modelFactoryOrJson as ModelFactory<T>;
    json = v;
  } else {
    if (maybeJson !== undefined) {
      throw new Error('Must use two argument form');
    }
    modelFactory = propKeyOrFactory;
    json = modelFactoryOrJson as JsonObject;

  }

  if (typeof json['totalItemCount'] !== 'number') {
    throw new Error("ModelIndexPage: 'totalItemCount' must be a number");
  }
  if (typeof json['totalPageCount'] !== 'number') {
    throw new Error("ModelIndexPage: 'totalPageCount' must be a number");
  }
  if (typeof json['pageIndex'] !== 'number') {
    throw new Error("ModelIndexPage: 'pageIndex' must be a number");
  }
  if (typeof json['pageSize'] !== 'number') {
    throw new Error("ModelIndexPage: 'pageSize' must be a number");
  }
  if (!Array.isArray(json['items']) || !json['items'].every(isJsonObject)) {
    throw new Error("ModelIndexPage: 'items' must be an array of json objects");
  }

  const items = Array.from(json['items']).map((itemJson) =>
    new modelFactory(itemJson),
  );

  return {
    items,
    totalItemCount: json['totalItemCount'],
    totalPageCount: json['totalPageCount'],
    pageIndex: json['pageIndex'],
    pageSize: json['pageSize'],
  };
}

export interface ModelQuery<T extends Model> {
  /**
   * Query for multiple ids from the same model.
   */
  id_in?: readonly string[];
  /**
   * Represents a full-text search of the model and it's attributes.
   * More useful for some models than others.
   * This is implemented by the api server in a model dependent way, check
   * the models documentation to see which attributes are available in the
   * search
   */
  search?: string;
}

export function setModelQueryParams(params: HttpParams, query: Partial<ModelQuery<any>>) {
  if (query.id_in) {
    params = params.set('id_in', query.id_in.join(','));
  }

  if (query.search) {
    params = params.set('search', query.search);
  }
  return params;
}

export function injectQueryPage<T extends Model>(
  serviceType: Type<ModelService<T>>,
  query: ModelQuery<T>,
  pageNumber: Observable<number>,
): Connectable<ModelIndexPage<T>> {
  const service = inject(serviceType);

  return connectable(
    pageNumber.pipe(
      switchMap(pageNumber => service.queryPage(query, pageNumber))
    ),
    { connector: () => new ReplaySubject(1) }
  );
}

export interface ModelCreateRequest<T extends Model> {
}

export interface ModelUpdateRequest<T extends Model> {
}

export type ModelRef<T extends Model> = T | string;
export type ModelOf<T> = T extends ModelRef<infer U> ?
  (U extends T ? U : never)
  : never;

export function isModelRef(obj: unknown): obj is ModelRef<any>;
export function isModelRef<T extends Model>(obj: unknown, model: Type<T>): obj is ModelRef<T>;

export function isModelRef<T extends Model = any>(obj: unknown, model?: Type<T>): obj is ModelRef<T> {
  return (typeof obj === 'string' && validateIsUUID(obj))
    || obj instanceof (model !== undefined ? model : Model);
}

export function isEqualModelRefs<T extends Model>(a: ModelRef<T> | null, b: ModelRef<T> | null): boolean {
  if (a == null || b == null) {
    return a == null && b == null;
  }
  return modelId(a) == modelId(b);
}


export function modelId(ref: ModelRef<any>): string;
export function modelId(ref: ModelRef<any> | null): string | null;

export function modelId(ref: ModelRef<any> | null): string | null {
  return typeof ref === 'string' ? ref : ref.id;
}

export function resolveRef<T extends Model>(ref: ModelRef<T>, service: ModelService<T>): Promise<T>;
export function resolveRef<T extends Model>(ref: ModelRef<T> | null, service: ModelService<T>): Promise<T | null>;

export function resolveRef<T extends Model>(ref: ModelRef<T> | null, service: ModelService<T>): Promise<T | null> {
  return firstValueFrom(typeof ref === 'string' ? service.fetch(ref) : of(ref));
}

export function modelRefFromJson<T extends Model>(propKey: string, modelFromJsonObject: ModelFactory<T>, json: JsonObject): ModelRef<T> {
  const v = json[propKey];

  if (typeof v === 'string' && validateIsUUID(v)) {
    return v;
  } else if (isJsonObject(v)) {
    return new modelFromJsonObject(json);
  } else {
    throw new Error(`Expected a UUID or json object '${propKey}'.`);
  }
}
