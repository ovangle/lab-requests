import {
  HttpClient,
  HttpParams,
  HttpParamsOptions,
} from '@angular/common/http';
import {
  Inject,
  Injectable,
  InjectionToken,
  Provider,
  Type,
  inject,
} from '@angular/core';
import {
  Model,
  ModelParams,
  ModelIndexPage,
  modelIndexPageFromJsonObject,
  ModelQuery,
  ModelCreateRequest,
  ModelUpdateRequest,
} from './model';
import urlJoin from 'url-join';
import { Observable, Subject, map, of, tap } from 'rxjs';
import { JsonObject } from 'src/app/utils/is-json-object';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable()
export abstract class ModelService<T extends Model, TQuery extends ModelQuery<T> = ModelQuery<T>> {
  protected readonly _httpClient = inject(HttpClient);
  protected readonly _apiBaseUrl = inject(API_BASE_URL);
  protected readonly _cache = new Map<string, T>();

  protected _cacheOne = tap((model: T) => this._cache.set(model.id, model));
  protected _cachePage = tap((page: ModelIndexPage<T>) => {
    page.items.forEach(item => this._cache.set(item.id, item))
  })

  protected _tryFetchCache(
    id: string,
    doFetch: () => Observable<T>
  ): Observable<T> {
    if (this._cache.has(id)) {
      return of(this._cache.get(id)!);
    }
    return doFetch();
  }

  abstract modelFromJsonObject(json: JsonObject): T;
  abstract modelQueryToHttpParams(lookup: TQuery): HttpParams;
  abstract modelUrl(model: T): Observable<string>;

  modelIndexPageFromJsonObject(json: JsonObject): ModelIndexPage<T> {
    return modelIndexPageFromJsonObject(
      (o) => this.modelFromJsonObject(o),
      json,
    );
  }

  protected abstract _doFetch(id: string): Observable<JsonObject>;

  fetch(id: string, options = { useCache: true }): Observable<T> {
    if (options.useCache && this._cache.has(id)) {
      return of(this._cache.get(id)!);
    }
    return this._doFetch(id).pipe(
      map(response => this.modelFromJsonObject(response)),
      this._cacheOne
    );
  }

  /**
   * @param lookup
   * @returns
   */
  query(params: TQuery): Observable<T[]> {
    return this.queryPage(params).pipe(map((page) => page.items));
  }

  queryOne(params: TQuery): Observable<T | null> {
    return this.query(params).pipe(
      map((items) => {
        if (items.length > 1) {
          throw new Error('Server returned multiple results');
        }
        return items[ 0 ] || null;
      }),
    );
  }

  protected abstract _doQueryPage(params: HttpParams): Observable<JsonObject>;

  queryPage(lookup: TQuery, pageNum = 1): Observable<ModelIndexPage<T>> {
    let params = this.modelQueryToHttpParams(lookup);
    params = params.set('page', pageNum);

    return this._doQueryPage(params).pipe(
      map(response => this.modelIndexPageFromJsonObject(response)),
      this._cachePage
    );
  }
}

/**
 * A Resource service is a model service with a restful
 * path from root.
 */
@Injectable()
export abstract class RestfulService<
  T extends Model,
  TQuery extends ModelQuery<T> = ModelQuery<T>,
  TCreate extends ModelCreateRequest<T> = ModelCreateRequest<T>,
  TUpdate extends ModelUpdateRequest<T> = ModelUpdateRequest<T>
> extends ModelService<T, TQuery> {
  abstract readonly path: string;

  abstract createToJsonObject?(request: TCreate): JsonObject;
  abstract actionToJsonObject?(request: TUpdate): JsonObject;

  get indexUrl(): string {
    return urlJoin(this._apiBaseUrl, this.path);
  }

  /** A static RPC method on the resource index.
   *  e.g. /users/me
   */
  indexMethodUrl(name: string) {
    return urlJoin(this.indexUrl, name);
  }

  resourceUrl(id: string) {
    return urlJoin(this._apiBaseUrl, this.path, id);
  }

  modelUrl(model: T) {
    return of(this.resourceUrl(model.id));
  }

  /**
   * An RPC method which acts on a particular resource
   * e.g. /users/
   *
   * @param id
   * @param name
   * @returns
   */
  resourceMethodUrl(id: string, name: string) {
    return urlJoin(this.resourceUrl(id), name);
  }

  protected override _doFetch(
    id: string,
    options?: { params: { [ k: string ]: any } | HttpParams },
  ): Observable<JsonObject> {
    return this._httpClient.get<JsonObject>(this.resourceUrl(id), {
      params: options?.params,
    });
  }

  protected override _doQueryPage(
    params: HttpParams | { [ k: string ]: string | number | string[] },
  ): Observable<JsonObject> {
    return this._httpClient
      .get<JsonObject>(this.indexUrl, { params: params })
  }

  create(request: TCreate): Observable<T> {
    if (this.createToJsonObject === undefined) {
      throw new Error("service defines no createRequestToJsonObject method")
    }
    const body = this.createToJsonObject(request);

    return this._httpClient
      .post<JsonObject>(this.indexUrl, body).pipe(
        map(response => this.modelFromJsonObject(response)),
        this._cacheOne
      );
  }

  update(model: T, request: TUpdate) {
    if (this.actionToJsonObject === undefined) {
      throw new Error('service defines no updateRequestToJsonObject method');
    }
    const body = this.actionToJsonObject(request);
    return this._httpClient.put<JsonObject>(this.resourceUrl(model.id), body).pipe(
      map(response => this.modelFromJsonObject(response)),
      this._cacheOne
    );
  }
}
