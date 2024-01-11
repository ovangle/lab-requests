import { DestroyRef, Injectable, Type, inject } from '@angular/core';
import {
  Observable,
  ReplaySubject,
  Subject,
  debounceTime,
  defer,
  filter,
  firstValueFrom,
  map,
  of,
  shareReplay,
  skipWhile,
  switchMap,
  tap,
} from 'rxjs';
import { Model, ModelIndexPage, ModelParams, ModelPatch } from './model';
import { API_BASE_URL, ModelService, RestfulService } from './model-service';
import {
  HttpClient,
  HttpParams,
  HttpParamsOptions,
} from '@angular/common/http';
import { JsonObject } from 'src/app/utils/is-json-object';
import { requiresAuthorizationGuard } from 'src/app/utils/router-utils';

export class ModelCollection<
  T extends Model,
  TService extends RestfulService<T> = RestfulService<T>,
> implements RestfulService<T>
{
  get model() {
    return this.service.model;
  }

  readonly _cache = new Map<string, T>();
  protected _cacheResult = tap((value: T) => this._cache.set(value.id, value));
  protected _maybeCacheResult = tap((value: T | null) => {
    if (value != null) {
      this._cache.set(value.id, value);
    }
  });
  protected _cacheManyResults = tap((values: T[]) => {
    values.forEach((item) => this._cache.set(item.id, item));
  });
  protected _cacheResultPage = tap((page: ModelIndexPage<T>) => {
    page.items.forEach((item) => this._cache.set(item.id, item));
  });
  readonly path: string;
  readonly indexUrl: string;

  constructor(readonly service: TService) {
    this.path = service.path;
    this.indexUrl = service.indexUrl;
    const destroyRef = inject(DestroyRef, { optional: true });

    if (destroyRef) {
      destroyRef.onDestroy(() => {
        this._cache.clear();
      });
    }
  }
  _httpClient: HttpClient = inject(HttpClient);
  _apiBaseUrl: string = inject(API_BASE_URL);

  modelFromJsonObject(json: JsonObject): T {
    return this.service.modelFromJsonObject(json);
  }

  modelPatchToJsonObject(patch: ModelPatch<T>): JsonObject {
    return this.service.modelPatchToJsonObject(patch);
  }

  modelIndexPageFromJsonObject(json: JsonObject): ModelIndexPage<T> {
    return this.service.modelIndexPageFromJsonObject(json);
  }
  query(
    params: HttpParams | { [k: string]: string | number | string[] },
  ): Observable<T[]> {
    return this.service.query(params).pipe(this._cacheManyResults);
  }
  queryOne(params: HttpParams | { [k: string]: string | number | string[] }) {
    return this.service.queryOne(params).pipe(this._maybeCacheResult);
  }
  queryPage(
    params: HttpParams | { [k: string]: string | number | string[] },
  ): Observable<ModelIndexPage<T>> {
    return this.service.queryPage(params).pipe(this._cacheResultPage);
  }

  fetch(id: string): Observable<T> {
    if (this._cache.has(id)) {
      return of(this._cache.get(id)!);
    }
    return this.service.fetch(id).pipe(this._cacheResult);
  }

  create(patch: ModelPatch<T>): Observable<T> {
    return this.service.create(patch).pipe(this._cacheResult);
  }

  update(model: T | string, request: ModelPatch<T>) {
    return this.service.update(model, request).pipe(this._cacheResult);
  }

  indexMethodUrl(name: string): string {
    return this.service.indexMethodUrl(name);
  }
  resourceUrl(id: string): string {
    return this.service.resourceUrl(id);
  }
  resourceMethodUrl(id: string, name: string): string {
    return this.service.resourceMethodUrl(id, name);
  }
}

export function injectModelService<
  T extends Model,
  TService extends ModelService<T> = ModelService<T>,
>(
  serviceType: Type<TService>,
  collectionType: Type<ModelCollection<T> & TService>,
): TService {
  const maybeCollection = inject(collectionType, { optional: true });
  if (maybeCollection) {
    return maybeCollection;
  }
  return inject(serviceType);
}
