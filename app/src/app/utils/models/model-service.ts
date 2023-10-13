import { _isTestEnvironment } from "@angular/cdk/platform";
import { HttpClient, HttpParams } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, isObservable, map, of, switchMap } from "rxjs";

import urlJoin from "url-join";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export interface Model {
    readonly id: string;
}

export interface Lookup<T extends Model> {
    pageId?: string;
}

export interface Page<T extends Model> {
    readonly items: T[];
    readonly pageId: string;
    readonly next?: string;
    readonly totalItemCount: number;
}

export abstract class ModelService<T extends Model, TPatch, TCreate extends TPatch=TPatch> {
    httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    // the base of the api path to this resource route
    abstract readonly resourcePath: string;

    abstract modelFromJson(json: object): T;
    abstract patchToJson(patch: TPatch): object; 
    abstract createToJson(create: TCreate): object; 
    abstract lookupToHttpParams(lookup: Partial<Lookup<T>>): HttpParams; 

    protected _resourceUrl(identifier: string, options?: {resourcePath?: string}) {
        const resourcePath: string = options && options.resourcePath || this.resourcePath;
        return urlJoin(this.apiBaseUrl, resourcePath, identifier)
    }

    protected _indexUrl(options?: {resourcePath?: string}) {
        const resourcePath: string = options && options.resourcePath || this.resourcePath;
        const indexUrl = urlJoin(this.apiBaseUrl, resourcePath, '/')
        return indexUrl;
    }

    fetch(identifier: string, options?: {
        params?: {[k: string]: any},
        resourcePath?: string
    }): Observable<T> {
        const url = this._resourceUrl(identifier, options);
        return this.httpClient.get(url, {params: options?.params}).pipe(
            map(result => this.modelFromJson(result))
        )
    }

    query(params: {[k: string]: any}, options?: {resourcePath?: string}): Observable<T[]> {
        const url = this._indexUrl(options);
        return this.httpClient.get<{items: object[]}>(url, {params: params}).pipe(
            map(result => result.items.map(item => this.modelFromJson(item)))
        );
    }

    queryPage(lookup: Lookup<T>, options?: {resourcePath?: string}): Observable<Page<T>> {
        const url = this._indexUrl(options);
        const params = this.lookupToHttpParams(lookup);
        return this.httpClient.get<{items: object[], totalItemCount: number, pageId: string, nextId: string}>(url, {params}).pipe(
            map((result) => {
                return {
                    items: result.items.map(item => this.modelFromJson(item)),
                    totalItemCount: result.totalItemCount,
                    pageId: result.pageId,
                    next: result.nextId
                };
            })
        )

    }

    create(patch: TCreate, options?: {resourcePath?: string}): Observable<T> {
        const url = this._indexUrl(options);

        return this.httpClient.post<object>(url, this.createToJson(patch)).pipe(
            map(result => this.modelFromJson(result))
        );
    }

    update(identifier: string, patch: TPatch, options?: {resourcePath?: string}): Observable<T> {
        const url = this._resourceUrl(identifier, options);
        return this.httpClient.put(url, this.patchToJson(patch)).pipe(
            map(result => this.modelFromJson(result))
        );
    }
}
