import { Injectable, inject } from "@angular/core";
import { FormGroup } from "@angular/forms";

export type ResourceType = 'software' | 'equipment' | 'input-material' | 'output-material';


export interface Resource {
}

@Injectable()
export abstract class ResourceService<T extends Resource, F extends FormGroup<any>> {
    abstract ctor(partialResource: Partial<T>): T;

    fromForm(resourceForm: F): T {
        return this.ctor(resourceForm.value);
    }

    abstract resourceForm(): F;
}

const RESOURCE_TYPE_NAMES: {[K in ResourceType]: string} = {
    'equipment': 'Equipment',
    'software': 'Software',
    'input-material': 'Input material',
    'output-material': 'Output material'
}

export function resourceTypeName(r: ResourceType) {
    return RESOURCE_TYPE_NAMES[r];
}