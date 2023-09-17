import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { isThisSecond } from "date-fns";

export const RESOURCE_STORAGE_TYPES = [
    'general',
    'samples',
    'chemical',
    'dry',
    'biological',
    'cold (-4 °C)',
    'frozen (-18 °C)',
    'ult (-80 °C)',
    'other'
] as const;
export type ResourceStorageType = typeof RESOURCE_STORAGE_TYPES[number];

export function isResourceStorageType(obj: any): obj is ResourceStorageType {
    return typeof obj === 'string'
        && RESOURCE_STORAGE_TYPES.includes(obj as any);
}

export class ResourceStorage {
    type: ResourceStorageType;
    otherDescription: string | null;

    constructor(storage: Partial<ResourceStorage>) {
        this.type = storage.type || 'general';
        this.otherDescription = storage.otherDescription || null;
    }
}

export function resourceStorageFromJson(json: {[k: string]: any}): ResourceStorage {
    return new ResourceStorage({
        type: json['type'],
        otherDescription: json['otherDescription']
    })
}


export function resourceStorageToJson(storage: ResourceStorage): {[k: string]: any} {
    return {
        type: storage.type,
        otherDescription: storage.otherDescription
    };
}

function otherDescriptionRequired(control: AbstractControl<string>) {
    if (!isResourceStorageForm(control.parent)) {
        return {notInResourceStorageForm: 'parent control must be a resource storage form'};
    }
    const typeControl = control.parent.controls.type;
    if (typeControl.value === 'other') {
        return Validators.required(control);
    }
    return null;
}

export type ResourceStorageForm = FormGroup<{
    type: FormControl<ResourceStorageType>,
    otherDescription: FormControl<string | null>
}>;

export function isResourceStorageForm(obj: any): obj is ResourceStorageForm {
    return obj instanceof FormGroup;
}

export function createResourceStorageForm(storage: Partial<ResourceStorage>): ResourceStorageForm {
    return new FormGroup({
        type: new FormControl<ResourceStorageType>(storage?.type || 'general', {nonNullable: true}),
        otherDescription: new FormControl(storage?.otherDescription || null, {
            validators: [otherDescriptionRequired]
        })
    })
}
