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

  readonly _resolvedRefs: Map<string, Model>;

  constructor(params: ModelParams) {
    this.id = params.id;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;

    this._resolvedRefs = new Map();
  }
}

export interface ModelParams {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function modelParamsFromJsonObject(json: JsonObject): ModelParams {
  const id = json[ 'id' ];
  if (typeof id !== 'string') {
    throw new Error("Expected a string 'id'");
  }
  if (typeof json[ 'createdAt' ] !== 'string') {
    throw new Error("Expected string 'createdAt'");
  }
  const createdAt = parseISO(json[ 'createdAt' ]);

  if (typeof json[ 'updatedAt' ] !== 'string') {
    throw new Error("Expected string 'createdAt'");
  }
  const updatedAt = parseISO(json[ 'updatedAt' ]);

  return { id, createdAt, updatedAt };
}

export interface ModelIndexPage<T extends Model> {
  readonly items: T[];

  readonly totalItemCount: number;
  readonly totalPageCount: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export function modelIndexPageFromJsonObject<T extends Model>(
  modelFromJsonObject: (obj: JsonObject) => T,
  json: JsonObject,
): ModelIndexPage<T> {
  if (typeof json[ 'totalItemCount' ] !== 'number') {
    throw new Error("ModelIndexPage: 'totalItemCount' must be a number");
  }
  if (typeof json[ 'totalPageCount' ] !== 'number') {
    throw new Error("ModelIndexPage: 'totalPageCount' must be a number");
  }
  if (typeof json[ 'pageIndex' ] !== 'number') {
    throw new Error("ModelIndexPage: 'pageIndex' must be a number");
  }
  if (typeof json[ 'pageSize' ] !== 'number') {
    throw new Error("ModelIndexPage: 'pageSize' must be a number");
  }
  if (!Array.isArray(json[ 'items' ]) || !json[ 'items' ].every(isJsonObject)) {
    throw new Error("ModelIndexPage: 'items' must be an array of json objects");
  }

  const items = Array.from(json[ 'items' ]).map((itemJson) =>
    modelFromJsonObject(itemJson),
  );

  return {
    items,
    totalItemCount: json[ 'totalItemCount' ],
    totalPageCount: json[ 'totalPageCount' ],
    pageIndex: json[ 'pageIndex' ],
    pageSize: json[ 'pageSize' ],
  };
}

export interface ModelQuery<T extends Model> {
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

export function isModelRef(obj: unknown): obj is ModelRef<any> {
  return (typeof obj === 'string' && validateIsUUID(obj)) || obj instanceof Model;
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

export function resolveRef<T extends Model>(ref: ModelRef<T>, service: ModelService<T>): Observable<T>;
export function resolveRef<T extends Model>(ref: ModelRef<T> | null, service: ModelService<T>): Observable<T | null>;

export function resolveRef<T extends Model>(ref: ModelRef<T> | null, service: ModelService<T>): Observable<T | null> {
  return typeof ref === 'string' ? service.fetch(ref) : of(ref);
}

export async function resolveModelRef<
  TModel extends Model,
  K extends keyof TModel,
  TRelated extends ModelOf<TModel[ K ]>
>(
  on: TModel,
  attr: K,
  usingModelService: ModelService<TRelated, any>
): Promise<TRelated> {
  const value = on[ attr ];
  if (typeof value === 'string') {
    if (!on._resolvedRefs.has(value)) {
      const resolvedValue = await firstValueFrom(usingModelService.fetch(value));
      on._resolvedRefs.set(value, resolvedValue);
    }
    return on._resolvedRefs.get(value)! as TRelated;
  } else {
    return value as TRelated;
  }
}

export function modelRefJsonDecoder<T extends Model>(key: string, modelFromJsonObject: (json: JsonObject) => T): (json: JsonObject) => ModelRef<T>;
export function modelRefJsonDecoder<T extends Model>(key: string, modelFromJsonObject: (json: JsonObject) => T, options: { nullable: true }): (json: JsonObject) => ModelRef<T> | null;

export function modelRefJsonDecoder<T extends Model>(key: string, modelFromJsonObject: (json: JsonObject) => T, options?: { nullable: boolean; }): (json: JsonObject) => ModelRef<T> | null {
  return (json: JsonObject) => {
    const value = json[ key ];
    if (options?.nullable && value == null) {
      return null;
    } else if (typeof value === 'string' && validateIsUUID(value)) {
      return value;
    } else if (isJsonObject(value)) {
      return modelFromJsonObject(value);
    } else {
      if (options?.nullable) {
        throw new Error(`Expected a UUID, json object or null '${key}'.`);
      } else {
        throw new Error(`Expected a UUID or json object '${key}'.`);
      }
    }
  }
}
