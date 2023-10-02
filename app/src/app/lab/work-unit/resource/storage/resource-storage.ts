import { AbstractControl, FormControl, FormGroup, Validators } from "@angular/forms";
import { isThisSecond } from "date-fns";
import { map, switchMap } from "rxjs";
import { CostEstimateForm, costEstimateForm, costEstimatesFromFormValue } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form";
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/coste-estimate";

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

export interface ResourceStorageParams {
    description?: string;
    estimatedCost: CostEstimate | null;
}

export class ResourceStorage {
    description: string; 
    estimatedCost: CostEstimate | null;

    constructor(params: ResourceStorageParams) {
        this.description = params.description || 'general';
        this.estimatedCost = params.estimatedCost || null;
    }

    get type(): ResourceStorageType {
        if (isResourceStorageType(this.description)) {
            return this.description;
        }
        return 'other';
    }

    get hasCostEstimates(): boolean {
        return this.estimatedCost != null;
    }
}

export function resourceStorageFromJson(json: {[k: string]: any}): ResourceStorage {
    const estimatedCost = json['estimatedCost'] ? costEstimateFromJson(json['estimatedCost']) : null;

    return new ResourceStorage({
        description: json['description'],
        estimatedCost
    })
}


export function resourceStorageToJson(storage: ResourceStorage): {[k: string]: any} {
    return {
        description: storage.description,
        estimatedCost: storage.estimatedCost && costEstimateToJson(storage.estimatedCost)
    };
}


export type ResourceStorageForm = FormGroup<{
    type: FormControl<ResourceStorageType>;
    description: FormControl<string>;
    hasCostEstimates: FormControl<boolean>;
    estimatedCost: CostEstimateForm;
}>;

export function createResourceStorageForm(): ResourceStorageForm {
    return new FormGroup({
        type: new FormControl<ResourceStorageType>('general', {nonNullable: true}),
        description: new FormControl<string>(
            '', 
            {nonNullable: true, validators: [Validators.required]}
        ),
        hasCostEstimates: new FormControl(false, {nonNullable: true}),
        estimatedCost: costEstimateForm()
    });
}

export function resourceStorageFromFormValue(form: ResourceStorageForm): ResourceStorage {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    const description = form.value.type === 'other'
        ? form.value.description
        : form.value.type!;

    const estimatedCost = form.value.hasCostEstimates 
        ? costEstimatesFromFormValue(form.controls.estimatedCost)
        : null;
    return new ResourceStorage({
        description,
        estimatedCost
    });
}

export function patchResourceStorageFormValue(form: ResourceStorageForm, storage: ResourceStorage, options?: any) {
    form.patchValue({
        type: storage.type,
        description: storage.description,
        hasCostEstimates: storage.estimatedCost != null,
        estimatedCost: storage.estimatedCost || {}
    }, options);
}
