import { FormControl, FormGroup } from "@angular/forms";
import { ResourceFileAttachment, resourceFileAttachmentFromJson } from "../work-unit/resource/file-attachment/file-attachment";
import { ResourceParams, Resource } from "../work-unit/resource/resource";
import { Injectable, Type, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { Model, ModelLookup, ModelMeta, ModelParams, modelParamsFromJsonObject } from "src/app/common/model/model";
import { ModelService, RestfulService } from "src/app/common/model/model-service";
import { JsonObject, isJsonObject } from "src/app/utils/is-json-object";
import { ModelContext } from "src/app/common/model/context";

export interface SoftwareParams extends ModelParams {
    readonly id: string;

    name: string;
}

function softwareParamsFromJson(json: JsonObject) {
    const baseParams = modelParamsFromJsonObject(json);

    if (typeof json[ 'name' ] !== 'string') {
        throw new Error('Expected a string \'name\'');
    }

    return {
        ...baseParams,
        name: json[ 'name' ],
    };
}

export class Software extends Model {
    readonly type = 'software';

    name: string;

    constructor(params: SoftwareParams) {
        super(params);
        this.name = params.name;
    }
}

export function softwareFromJson(json: JsonObject): Software {
    return new Software(softwareParamsFromJson(json));
}

export interface SoftwarePatch {
    name: string;
    description: string;
}

export function softwarePatchToJson(patch: SoftwarePatch) {
    return {
        name: patch.name,
        description: patch.description
    };
}

export interface NewSoftwareRequest {
    name: string;
    description: string;
}

export function isNewSoftwareRequest(obj: any): obj is NewSoftwareRequest {
    return typeof obj === 'object' && obj != null && typeof obj.name === 'string';
}

export function newSoftwareRequestForm() {
    return new FormGroup({
        name: new FormControl('', { nonNullable: true }),
        description: new FormControl('', { nonNullable: true })
    });
}

export interface SoftwareLookup extends ModelLookup<Software> {
    readonly searchText: string;
}

export function softwareLookupToHttpParams(lookup: Partial<SoftwareLookup>) {
    const params = new HttpParams();
    if (lookup.searchText) {
        params.set('search', lookup.searchText);
    }
    return params;
}

@Injectable({ providedIn: 'root' })
export class SoftwareMeta extends ModelMeta<Software, SoftwarePatch, SoftwareLookup> {
    override model: Type<Software>;
    override modelParamsFromJson(json: unknown): ModelParams {
        if (!isJsonObject(json)) {
            throw new Error('Expected a json object')
        }
        return softwareParamsFromJson(json);
    }
    override modelPatchToJson(patch: SoftwarePatch): { [ k: string ]: any; } {
        throw new Error("Method not implemented.");
    }
    override lookupToHttpParams(lookup: Partial<SoftwareLookup>): HttpParams {
        throw new Error("Method not implemented.");
    }

}

@Injectable({ providedIn: 'root' })
export class SoftwareModelService extends RestfulService<Software, SoftwarePatch, SoftwareLookup> {
    override readonly metadata = inject(SoftwareMeta);

    override readonly path: string = '/lab/softwares';
    override readonly lookupToHttpParams = softwareLookupToHttpParams;
}

@Injectable()
export class SoftwareContext extends ModelContext<Software, SoftwarePatch> {
    readonly software$ = this.committed$;

    override _doUpdate(identifier: string, patch: SoftwarePatch): Promise<Software> {
        throw new Error('Not implemented')
    }
}