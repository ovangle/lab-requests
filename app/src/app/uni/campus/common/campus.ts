import { Injectable, inject } from "@angular/core";
import { Model, ModelLookup, ModelMeta, ModelParams, ModelPatch, ModelResponsePage, modelLookupToHttpParams, modelParamsFromJson } from "src/app/common/model/model";
import { ModelService, RestfulService, modelProviders } from "src/app/common/model/model-service";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";

export type CampusCode = string;
export function isCampusCode(obj: any): obj is CampusCode {
    return typeof obj === 'string' && /^[A-Z]{0,8}$/.test(obj);
}
export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export interface CampusParams extends ModelParams {
    readonly code: CampusCode;
    readonly name: string;
}

export function campusParamsFromJson(json: unknown) {
    if (typeof json !== 'object' || json == null) {
        throw new Error('Expected a campus');
    }
    const obj: {[k: string]: unknown} = json as any;

    const baseParams = modelParamsFromJson(obj);

    if (!isCampusCode(obj['code'])) {
        throw new Error('Expected a campus code');
    }

    return {
        ...baseParams,
        code: obj['code'],
        name: obj['name'] as string
    };
}

export function campusFromJson(json: unknown) {
    return new Campus(campusParamsFromJson(json));
}

export class Campus extends Model {
    readonly code: CampusCode;

    name: string;

    constructor(params: CampusParams) {
        super(params);
        this.code = params.code;
        this.name = params.name;
    }
}

export interface CampusPatch extends ModelPatch<Campus> {

}

export function campusPatchToJson(patch: CampusPatch): {[k: string]: unknown} {
    throw new Error('Not implemented');
}

export interface CampusLookup extends ModelLookup<Campus> {
    code?: CampusCode;

}

export function campusLookupToHttpParams(lookup: Partial<CampusLookup>): HttpParams {
    const params = modelLookupToHttpParams(lookup);
    if (lookup.code) {
        params.set('code', lookup.code);
    }
    return params;
}

export class CampusMeta extends ModelMeta<Campus, CampusPatch, CampusLookup> {
    readonly model = Campus;
    readonly modelParamsFromJson = campusParamsFromJson;
    readonly modelPatchToJson = campusPatchToJson;
    readonly lookupToHttpParams = campusLookupToHttpParams;

}

@Injectable()
export class CampusService extends RestfulService<Campus, CampusPatch, CampusLookup> {
    override readonly metadata = inject(CampusMeta);
    override readonly path = '/uni/campuses';

    getForCode(code: CampusCode) {
        return this.queryOne({code: code});
    }
}

export function uniCampusModelProviders() {
    return modelProviders(CampusMeta, CampusService);
}