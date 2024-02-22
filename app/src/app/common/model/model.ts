import { Type, inject } from '@angular/core';
import { parseISO } from 'date-fns';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelService } from './model-service';
import { Connectable, Observable, ReplaySubject, connectable, switchMap } from 'rxjs';

export abstract class Model {
  readonly id: string;

  readonly createdAt: Date;
  readonly updatedAt: Date;
  constructor(params: ModelParams) {
    this.id = params.id;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}

export interface ModelParams {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export function modelParamsFromJsonObject(json: JsonObject): ModelParams {
  const id = json['id'];
  if (typeof id !== 'string') {
    throw new Error("Expected a string 'id'");
  }
  if (typeof json['createdAt'] !== 'string') {
    throw new Error("Expected string 'createdAt'");
  }
  const createdAt = parseISO(json['createdAt']);

  if (typeof json['updatedAt'] !== 'string') {
    throw new Error("Expected string 'createdAt'");
  }
  const updatedAt = parseISO(json['updatedAt']);

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
    modelFromJsonObject(itemJson),
  );

  return {
    items,
    totalItemCount: json['totalItemCount'],
    totalPageCount: json['totalPageCount'],
    pageIndex: json['pageIndex'],
    pageSize: json['pageSize'],
  };
}

export interface ModelQuery<T extends Model> { }

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

export interface ModelAction<T extends Model> {
  readonly name: string;
}

