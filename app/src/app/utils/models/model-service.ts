import { HttpClient } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, map } from "rxjs";

import urlJoin from "url-join";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

export abstract class ModelService<T, TPatch> {
    httpClient = inject(HttpClient);
    readonly apiBaseUrl = inject(API_BASE_URL);

    // the base of the api path to this resource route
    abstract readonly resourcePath: string;

    abstract modelFromJson(json: object): T;
    abstract patchToJson(patch: TPatch): object;
    
    get resourceUrl(): string {
        return urlJoin(this.apiBaseUrl, this.resourcePath);
    }

    read(identifier: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T> {
        return this.httpClient.get<object>(urlJoin(this.resourceUrl, identifier), {
            params: options?.params
        }).pipe(
            map(result => this.modelFromJson(result))
        )
    }

    query(params: {[k: string]: any}): Observable<T[]> {
        return this.httpClient.get<{items: object[]}>(this.resourceUrl, {
            params: params
        }).pipe(
            map(result => result.items.map(item => this.modelFromJson(item)))
        )
    }

    create(patch: TPatch): Observable<T> {
        return this.httpClient.post<object>(this.resourceUrl, this.patchToJson(patch)).pipe(
            map(result => this.modelFromJson(result))
        );
    }

    update(identifier: string, patch: TPatch): Observable<T> {
        return this.httpClient.post<object>(
            urlJoin(this.resourceUrl, identifier),
            this.patchToJson(patch)
        ).pipe(
            map(result => this.modelFromJson(result))
        );
    }
}
