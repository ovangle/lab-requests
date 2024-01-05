import { HttpClient, HttpParams } from '@angular/common/http';
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
  ModelLookup,
  ModelResponsePage,
  modelResponsePageFromJson,
  ModelPatch,
  ModelMeta,
} from './model';
import urlJoin from 'url-join';
import { Observable, Subject, map, tap } from 'rxjs';
import { JsonObject } from 'src/app/utils/is-json-object';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

@Injectable()
export abstract class ModelService<
  T extends Model,
  TPatch extends ModelPatch<T> = ModelPatch<T>,
  TLookup extends ModelLookup<T> = ModelLookup<T>,
> {
  readonly _httpClient = inject(HttpClient);
  readonly _apiBaseUrl = inject(API_BASE_URL);

  readonly _events = new Subject();
  readonly events = this._events.asObservable();

  abstract readonly metadata: ModelMeta<T, TPatch, TLookup>;

  get model(): Type<T> {
    return this.metadata.model;
  }

  modelFromJson(json: JsonObject) {
    return this.metadata.modelFromJson(json);
  }
  modelPatchToJson(patch: TPatch) {
    return this.metadata.modelPatchToJson(patch);
  }
  lookupToHttpParams(lookup: Partial<TLookup>) {
    return this.metadata.lookupToHttpParams(lookup);
  }

  responsePageFromJson(
    lookup: Partial<TLookup>,
  ): (json: unknown) => ModelResponsePage<T, TLookup> {
    return (json) => modelResponsePageFromJson(this.metadata, lookup, json);
  }

  abstract fetch(id: string): Observable<T>;

  /**
   * @param lookup
   * @returns
   */
  query(lookup: Partial<TLookup>): Observable<T[]> {
    return this.queryPage(lookup).pipe(map((page) => page.items));
  }
  queryCount(lookup: Partial<TLookup>): Observable<number> {
    return this.queryPage(lookup).pipe(map((page) => page.totalItemCount));
  }
  queryOne(lookup: Partial<TLookup>): Observable<T> {
    return this.queryPage(lookup).pipe(
      map((page) => {
        if (page.totalItemCount !== 1) {
          throw new Error('Expected a response with a single item');
        }
        return page.items[0];
      }),
    );
  }
  abstract queryPage(
    lookup: Partial<TLookup>,
  ): Observable<ModelResponsePage<T, TLookup>>;
  abstract create(patch: TPatch): Observable<T>;
  abstract update(id: string, params: TPatch): Observable<T>;
}

/**
 * A Resource service is a model service with a restful
 * path from root.
 */
@Injectable()
export abstract class RestfulService<
  T extends Model,
  TPatch extends ModelPatch<T> = ModelPatch<T>,
  TLookup extends ModelLookup<T> = ModelLookup<T>,
> extends ModelService<T, TPatch, TLookup> {
  abstract readonly path: string;

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
    options?: { params: { [k: string]: any } | HttpParams },
  ): Observable<T> {
    return this._httpClient
      .get<{ [k: string]: unknown }>(this.resourceUrl(id), {
        params: options?.params,
      })
      .pipe(map((result) => this.modelFromJson(result)));
  }

  override queryPage(
    lookup: Partial<TLookup>,
  ): Observable<ModelResponsePage<T, TLookup>> {
    const params = this.metadata.lookupToHttpParams(lookup);
    return this._httpClient
      .get(this.indexUrl, { params: params })
      .pipe(
        map((response) =>
          modelResponsePageFromJson(this.metadata, lookup, response),
        ),
      );
  }

  override create(patch: TPatch): Observable<T> {
    return this._httpClient
      .post<{ [k: string]: unknown }>(
        this.indexUrl + '/',
        this.modelPatchToJson(patch),
      )
      .pipe(map((result) => this.modelFromJson(result)));
  }

  override update(id: string, patch: TPatch): Observable<T> {
    return this._httpClient
      .put<{ [k: string]: unknown }>(
        this.resourceUrl(id),
        this.modelPatchToJson(patch),
      )
      .pipe(map((result) => this.modelFromJson(result)));
  }
}

export function modelProviders<T extends Model>(
  metaType: Type<ModelMeta<T>>,
  serviceType: Type<RestfulService<T, any, any>>,
): Provider[] {
  return [
    { provide: metaType, useClass: metaType },
    { provide: ModelMeta, multi: true, useExisting: metaType },
    { provide: serviceType, useClass: serviceType },
    { provide: ModelService, multi: true, useExisting: serviceType },
  ];
}

export function findModelService<T extends Model>(
  services: ModelService<any>[],
  model: Type<T>,
): ModelService<T> {
  const firstIndex = services.findIndex((item) => item.model === model);
  const nextIndex = services.findIndex(
    (item, i) => i > firstIndex && item.model === model,
  );
  if (firstIndex < 0) {
    throw new Error(`No restful service for ${model} provided`);
  }
  if (nextIndex >= 0) {
    throw new Error(`Multiple services were provided for model ${model}`);
  }
  return services[firstIndex] as ModelService<T>;
}
