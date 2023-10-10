import { FormControl, FormGroup } from "@angular/forms";
import { ResourceFileAttachment, resourceFileAttachmentFromJson } from "../work-unit/resource/file-attachment/file-attachment";
import { ResourceParams, Resource } from "../work-unit/resource/resource";
import { Injectable, inject } from "@angular/core";
import { Lookup, ModelService } from "src/app/utils/models/model-service";
import { HttpParams } from "@angular/common/http";
import { Context } from "src/app/utils/models/model-context";
import { Observable } from "rxjs";

export interface SoftwareParams {
    readonly id: string;

    name: string;
}

export class Software {
    readonly type = 'software';

    readonly id: string;

    name: string;

    constructor(params: SoftwareParams) {
        this.id = params.id;
        this.name = params.name;
    }
}

export function softwareFromJson(json: {[k: string]: any}): Software {
    const attachments = (json['attachments'] || [])
        .map(resourceFileAttachmentFromJson)

    return new Software({
        id: json['id'],
        name: json['name'],
    });
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
        name: new FormControl('', {nonNullable: true}),
        description: new FormControl('', {nonNullable: true})
    });
}

export interface SoftwareLookup extends Lookup<Software> {
    readonly searchText: string;
}

export function softwareLookupToHttpParams(lookup: Partial<SoftwareLookup>) {
    const params = new HttpParams();
    if (lookup.searchText) {
        params.set('search', lookup.searchText);
    }
    return params;
}

@Injectable()
export class SoftwareModelService extends ModelService<Software, SoftwarePatch> {
    override readonly resourcePath: string = '/lab/softwares';
    override readonly modelFromJson = softwareFromJson;
    override readonly patchToJson = softwarePatchToJson;
    override readonly createToJson = softwarePatchToJson;
    override readonly lookupToHttpParams = softwareLookupToHttpParams;
}

@Injectable()
export class SoftwareContext extends Context<Software, SoftwarePatch> {
    override readonly models: SoftwareModelService = inject(SoftwareModelService);

    readonly software$ = this.committed$;

    override _doCreate(request: SoftwarePatch): Observable<Software> {
        return this.models.create(request);
    }

    override _doCommit(identifier: string, patch: SoftwarePatch): Observable<Software> {
        return this.models.update(identifier, patch); 
    }
}