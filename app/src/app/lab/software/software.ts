import { FormControl, FormGroup } from "@angular/forms";

export interface SoftwareParams {
    readonly id: string;

    name: string;
    description?: string;
}

export class Software {
    readonly id: string;

    name: string;
    description: string;

    constructor(params: SoftwareParams) {
        this.id = params.id;
        this.name = params.name;
        this.description = params.description || '';
    }
}

export function softwareFromJson(json: {[k: string]: any}): Software {
    return new Software({
        id: json['id'],
        name: json['name'],
        description: json['description']
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
