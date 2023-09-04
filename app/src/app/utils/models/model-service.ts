import { HttpClient } from "@angular/common/http";
import { InjectionToken, inject } from "@angular/core";
import { Observable, map } from "rxjs";

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const MODEL_BASE_PATH = new InjectionToken<string>('MODEL_BASE_PATH');
export const MODEL_FACTORY = new InjectionToken<(json: object) => any>('MODEL_FACTORY');

export abstract class ModelService<T> {
    httpClient = inject(HttpClient);
    apiBaseUrl = inject(API_BASE_URL);

    modelFactory: (json: object) => T = inject(MODEL_FACTORY);

    _modelPath(path: string) {
        return this.apiBaseUrl + path;
    }

    protected get(path: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T> {
        return this.httpClient.get<object>(this._modelPath(path), {
            params: options?.params
        }).pipe(
            map(result => this.modelFactory(result))
        )
    }

    protected list(path: string, options?: {
        params?: {[k: string]: any}
    }): Observable<T[]> {
        return this.httpClient.get<{items: object[]}>(this._modelPath(path), {
            params: options?.params
        }).pipe(
            map(result => result.items.map(item => this.modelFactory(item)))
        )
    }

    protected create(path: string, params: {[k: string]: any}): Observable<T> {
        return this.httpClient.post(this._modelPath(path), params).pipe(
            map((result) => this.modelFactory(result))
        )
    }
}
