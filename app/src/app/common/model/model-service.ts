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
  ModelPatch,
} from './model';
import urlJoin from 'url-join';
import { Observable, Subject, map, tap } from 'rxjs';
import { JsonObject } from 'src/app/utils/is-json-object';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable()
export abstract class ModelService<T extends Model> {
  readonly _httpClient = inject(HttpClient);
  readonly _apiBaseUrl = inject(API_BASE_URL);

  abstract readonly model: Type<T>;
  abstract modelFromJsonObject(json: JsonObject): T;

  modelIndexPageFromJsonObject(json: JsonObject): ModelIndexPage<T> {
    return modelIndexPageFromJsonObject(
      (o) => this.modelFromJsonObject(o),
      json,
    );
  }

  abstract fetch(id: string): Observable<T>;

  /**
   * @param lookup
   * @returns
   */
  query(
    params: HttpParams | { [ k: string ]: number | string | string[] },
  ): Observable<T[]> {
    return this.queryPage(params).pipe(map((page) => page.items));
  }
  queryOne(
    params: HttpParams | { [ k: string ]: number | string | string[] },
  ): Observable<T | null> {
    return this.query(params).pipe(
      map((items) => {
        if (items.length > 1) {
          throw new Error('Server returned multiple results');
        }
        return items[ 0 ] || null;
      }),
    );
  }
  abstract queryPage(
    params: HttpParams | { [ k: string ]: number | string | string[] },
  ): Observable<ModelIndexPage<T>>;

  abstract create(request: ModelPatch<T>): Observable<T>;
  abstract update(model: T | string, request: ModelPatch<T>): Observable<T>;
}

/**
 * A Resource service is a model service with a restful
 * path from root.
 */
@Injectable()
export abstract class RestfulService<T extends Model> extends ModelService<T> {
  abstract readonly path: string;

  get indexUrl(): string {
    return urlJoin(this._apiBaseUrl, this.path);
  }

  /** A static RPC method on the resource index.
   *  e.g. /users/me
   */
  indexMethodUrl(name: string) {
    return urlJoin(this.indexUrl, name) + '/';
  }

  resourceUrl(id: string) {
    return urlJoin(this._apiBaseUrl, this.path, id);
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

  override fetch(
    id: string,
    options?: { params: { [ k: string ]: any } | HttpParams },
  ): Observable<T> {
    return this._httpClient
      .get<{ [ k: string ]: unknown }>(this.resourceUrl(id), {
        params: options?.params,
      })
      .pipe(map((result) => this.modelFromJsonObject(result)));
  }

  override queryPage(
    params: HttpParams | { [ k: string ]: string | number | string[] },
  ): Observable<ModelIndexPage<T>> {
    return this._httpClient
      .get<JsonObject>(this.indexUrl, { params: params })
      .pipe(map((json) => this.modelIndexPageFromJsonObject(json)));
  }

  override create(createRequest: ModelPatch<T>): Observable<T> {
    return this._httpClient
      .post<JsonObject>(
        this.indexUrl + '/',
        createRequest
      )
      .pipe(map((result) => this.modelFromJsonObject(result)));
  }

  override update(
    model: T | string,
    updateRequest: ModelPatch<T>,
  ): Observable<T> {
    if (typeof model !== 'string') {
      model = model.id;
    }

    return this._httpClient
      .put<JsonObject>(this.resourceUrl(model), updateRequest)
      .pipe(map((result) => this.modelFromJsonObject(result)));
  }
}
