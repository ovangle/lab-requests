import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { isThisSecond } from "date-fns";

export const RESOURCE_STORAGE_TYPES = [
    'samples',
    'chemical',
    'dry',
    'biological',
    'dry',
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
    otherDescription: string;
    /** The estimated space required to store the resource (in m^2) */
    estimatedSpace: number;

    constructor(storage: {readonly type: ResourceStorageType} & Partial<ResourceStorage>) {
        this.type = storage.type;
    }
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
    type: FormControl<ResourceStorageType | null>,
    otherDescription: FormControl<string>
    estimatedSpace: FormControl<number | null>
}>;

export function isResourceStorageForm(obj: any): obj is ResourceStorageForm {
    return obj instanceof FormGroup;
}

export function createResourceStorageForm(storage: Partial<ResourceStorage>): ResourceStorageForm {
    return new FormGroup({
        type: new FormControl<ResourceStorageType | null>(storage?.type || null),
        otherDescription: new FormControl(storage?.otherDescription || '', {
            nonNullable: true,
            validators: [otherDescriptionRequired]
        }),
        estimatedSpace: new FormControl(storage?.estimatedSpace || null)
    })
}
