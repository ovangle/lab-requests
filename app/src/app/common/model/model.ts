import { HttpParams } from "@angular/common/http";
import { Inject, Injectable, Type } from "@angular/core";
import { parseISO } from "date-fns";
import { JsonObject } from "src/app/utils/is-json-object";


export abstract class Model {
    readonly id: string;

    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor(params: ModelParams) {
        this.id = params.id;
        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
   }
}

export interface ModelParams {
    id: string; 
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export function modelParamsFromJsonObject(json: JsonObject): ModelParams {
    const id = json['id'];
    if (typeof id !== 'string') {
        throw new Error('Expected a string \'id\'');
    }
    if (typeof json['createdAt'] !== 'string') {
        throw new Error('Expected string \'createdAt\'')
    }
    const createdAt = parseISO(json['createdAt'])

    if (typeof json['updatedAt'] !== 'string') {
        throw new Error('Expected string \'createdAt\'')
    }
    const updatedAt = parseISO(json['updatedAt']);


    return { id, createdAt, updatedAt };
}

export interface ModelPatch<T extends Model = Model> {}

export function modelPatchToJson(patch: ModelPatch): {[k: string]: unknown} {
    return {};
}

export interface ModelLookup<T extends Model = Model> {
    id?: string;
    pageId?: number;
}

export function modelLookupToHttpParams(lookup: ModelLookup<any>): HttpParams {
    const params = new HttpParams();
    if (lookup.id) {
        params.set('id', lookup.id);
    }
    if (lookup.pageId) {
        params.set('page', lookup.pageId);
    }
    return params;
}

export interface ModelResponsePage<T extends Model, TLookup extends ModelLookup<T> = ModelLookup<T>> {
    readonly lookup: Partial<TLookup>;
    readonly items: T[];
    readonly next?: string;
    readonly totalItemCount: number;
}

export function modelResponsePageFromJson<T extends Model, TLookup extends ModelLookup<T> = ModelLookup<T>>(
    metadata: ModelMeta<T>, 
    lookup: Partial<TLookup>, 
    json: unknown
): ModelResponsePage<T, TLookup> {
    if (typeof json !== 'object' || json == null) {
        throw new Error('Expected an object at document root');
    }
    const obj: {[k: string]: any} = json;

    const items = Array.from(obj['items']).map(itemJson => {
        if (typeof itemJson !== 'object' || itemJson == null) {
            throw new Error('Page items must be a list of json objects');
        }
        return metadata.modelFromJson(itemJson);
    })

    return {
        lookup,
        items,
        next: obj['next'],
        totalItemCount: +obj['total_item_count']
    };
}


export abstract class ModelMeta<
    T extends Model, 
    TPatch extends ModelPatch<T> = ModelPatch<T>,
    TLookup extends ModelLookup<T> = ModelLookup<T>
> {
    abstract readonly model: Type<T>;

    abstract modelParamsFromJson(json: unknown): ModelParams;
    abstract modelPatchToJson(patch: TPatch): {[k: string]: any};
    abstract lookupToHttpParams(lookup: Partial<TLookup>): HttpParams;

    modelFromJson(json: unknown): T {
        return new this.model(this.modelParamsFromJson(json));
    }

    isEqualLookups(a: Partial<TLookup>, b: Partial<TLookup>) {
        return Object.entries(a).every(
            ([k, v]) => b.hasOwnProperty(k) && b[k as keyof TLookup] === v
        )
    }
}