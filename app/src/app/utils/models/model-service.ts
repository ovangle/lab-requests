import { HttpClient } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, isObservable, map, of, switchMap } from "rxjs";

import urlJoin from "url-join";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export abstract class ModelService<T, TPatch, TCreate extends TPatch=TPatch> {
    httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    // the base of the api path to this resource route
    abstract readonly resourcePath: string;

    abstract modelFromJson(json: object): T;
    patchToJson(patch: TPatch): object {
        return {...patch} as object;
    }
    createToJson(create: TCreate): object {
        return this.patchToJson(create);
    }

    read(identifier: string, options?: {
        params?: {[k: string]: any},
        resourcePath?: string
    }): Observable<T> {
        const resourcePath = (options && options.resourcePath) ? options.resourcePath : this.resourcePath;
        const url = urlJoin(resourcePath, identifier)
        return this.httpClient.get(url, {params: options?.params}).pipe(
            map(result => this.modelFromJson(result))
        )
    }

    query(params: {[k: string]: any}, options?: {resourcePath?: string}): Observable<T[]> {
        const resourcePath = (options && options.resourcePath) ? options.resourcePath : this.resourcePath;
        return this.httpClient.get<{items: object[]}>(resourcePath, {params: params}).pipe(
            map(result => result.items.map(item => this.modelFromJson(item)))
        );
    }

    create(patch: TCreate, options?: {resourcePath?: string}): Observable<T> {
        const resourcePath = (options && options.resourcePath) ? options.resourcePath : this.resourcePath;

        return this.httpClient.post<object>(resourcePath, this.createToJson(patch)).pipe(
            map(result => this.modelFromJson(result))
        );
    }

    update(identifier: string, patch: TPatch, options?: {resourcePath?: string}): Observable<T> {
        const resourcePath = (options && options.resourcePath) ? options.resourcePath : this.resourcePath;
        const url = urlJoin(resourcePath, identifier);
        return this.httpClient.post(url, this.patchToJson(patch)).pipe(
            map(result => this.modelFromJson(result))
        );
    }
}
