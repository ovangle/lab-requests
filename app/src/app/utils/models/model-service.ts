import { HttpClient } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import urlJoin from "url-join";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export abstract class ModelService<T> {
    httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    // the base of the api path to this resource route
    abstract readonly servicePath: string;
    abstract modelFromJson(json: object): T;

    resourceUrl(path: string) {
        return urlJoin(this.apiBaseUrl, this.servicePath, path);
    }

    protected get(path: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T> {
        return this.httpClient.get<object>(this.resourceUrl(path), {
            params: options?.params
        }).pipe(
            map(result => this.modelFromJson(result))
        )
    }

    protected list(path: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T[]> {
        return this.httpClient.get<{items: object[]}>(this.resourceUrl(path), {
            params: options?.params
        }).pipe(
            map(result => result.items.map(item => this.modelFromJson(item)))
        )
    }

    protected create(path: string, params: {[k: string]: any}): Observable<T> {
        return this.httpClient.post(this.resourceUrl(path), params).pipe(
            map((result) => this.modelFromJson(result))
        )
    }
}
