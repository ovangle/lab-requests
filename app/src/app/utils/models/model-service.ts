import { HttpClient } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, isObservable, map, of, switchMap } from "rxjs";

import urlJoin from "url-join";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export abstract class ModelService<T, TPatch> {
    httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    // the base of the api path to this resource route
    abstract readonly resourcePath: string | Observable<string>;

    abstract modelFromJson(json: object): T;
    abstract patchToJson(patch: TPatch): object;
    
    get resourceUrl$(): Observable<string> {
        return (
            isObservable(this.resourcePath) ? this.resourcePath : of(this.resourcePath)
        ).pipe(
            map(resourcePath => urlJoin(this.apiBaseUrl, resourcePath))
        );
    }

    read(identifier: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T> {
        return this.resourceUrl$.pipe(
            switchMap(resourceUrl => {
                const url = urlJoin(resourceUrl, identifier);
                return this.httpClient.get<object>(url, {params: options?.params})
            }),
            map(result => this.modelFromJson(result))
        );
    }

    query(params: {[k: string]: any}): Observable<T[]> {
        return this.resourceUrl$.pipe(
            switchMap(resourceUrl => this.httpClient.get<{items: object[]}>(resourceUrl, {params: params})),
            map(result => result.items.map(item => this.modelFromJson(item)))
        );
    }

    create(patch: TPatch): Observable<T> {
        return this.resourceUrl$.pipe(
            switchMap(url => this.httpClient.post<object>(url, this.patchToJson(patch))),
            map(result => this.modelFromJson(result))
        );
    }

    update(identifier: string, patch: TPatch): Observable<T> {
        return this.resourceUrl$.pipe(
            map(url => urlJoin(url, identifier)),
            switchMap(resourceUrl => this.httpClient.post(resourceUrl, this.patchToJson(patch))),
            map(result => this.modelFromJson(result))
        );
    }
}
