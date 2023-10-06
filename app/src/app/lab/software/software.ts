import { FormControl, FormGroup } from "@angular/forms";
import { ResourceFileAttachment, resourceFileAttachmentFromJson } from "../work-unit/resource/file-attachment/file-attachment";
import { ResourceParams, Resource } from "../work-unit/resource/resource";

export interface SoftwareParams extends ResourceParams<Software> {
    readonly id: string;

    name: string;
    description?: string;
}

export class Software implements Resource {
    readonly type = 'software';

    readonly planId: string;
    readonly workUnitId: string;
    readonly id: string;
    readonly index: number | 'create';

    name: string;
    description: string;

    readonly attachments: ResourceFileAttachment<this>[];

    constructor(params: SoftwareParams) {
        this.planId = params.planId;
        this.workUnitId = params.workUnitId;
        this.index = params.index;
        this.id = params.id;
        this.name = params.name;
        this.description = params.description || '';
    }
}

export function softwareFromJson(json: {[k: string]: any}): Software {
    const attachments = (json['attachments'] || [])
        .map(resourceFileAttachmentFromJson)

    return new Software({
        planId: json['planId'],
        workUnitId: json['workUnitId'],
        id: json['id'],
        index: json['index'],
        name: json['name'],
        description: json['description'],
        attachments
    });
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
