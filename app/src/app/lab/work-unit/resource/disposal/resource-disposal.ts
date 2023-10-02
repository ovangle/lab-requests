import { ThisReceiver } from "@angular/compiler";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { CostEstimateForm, costEstimateForm, costEstimatesFromFormValue } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form";
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/coste-estimate";

export const RESOURCE_DISPOSAL_TYPES = [
    'general',
    'bulk/landfill',
    'recyclable',
    'liquids/oil',
    'hazardous',
    'other'
] as const;

export type ResourceDisposalType = typeof RESOURCE_DISPOSAL_TYPES[number];

export function isResourceDisposalType(obj: any): obj is ResourceDisposalType {
    return typeof obj === 'string' && RESOURCE_DISPOSAL_TYPES.includes(obj as never);
}

export interface ResourceDisposalParams {
    readonly description: string;
    readonly estimatedCost: CostEstimate | null;
}

export class ResourceDisposal {
    readonly description: string;
    readonly estimatedCost: CostEstimate | null;

    constructor(params: ResourceDisposalParams) {
        this.description = params.description;
        this.estimatedCost = params.estimatedCost || null;
    }

    get type(): ResourceDisposalType {
        if (isResourceDisposalType(this.description)) {
            return this.description;
        }
        return 'other';
    }
}

export function resourceDisposalFromJson(json: {[k: string]: any}): ResourceDisposal {
    return new ResourceDisposal({
        description: json['description'],
        estimatedCost: json['estimatedCost'] && costEstimateFromJson(json['estimatedCost'])
    });
}


export function resourceDisposalToJson(disposal: ResourceDisposal): {[k: string]: any} {
    return {
        description: disposal.description,
        costEstimate: disposal.estimatedCost && costEstimateToJson(disposal.estimatedCost)
    }
}

export type ResourceDisposalForm = FormGroup<{
    type: FormControl<ResourceDisposalType>;
    description: FormControl<string>;
    hasCostEstimates: FormControl<boolean>;
    estimatedCost: CostEstimateForm;
}>;

export function createResourceDisposalForm(): ResourceDisposalForm {
    return new FormGroup({
        type: new FormControl<ResourceDisposalType>(
            'general',
            {nonNullable: true, validators: Validators.required}
        ),
        description: new FormControl<string>(
            '',
            {nonNullable: true}
        ),
        hasCostEstimates: new FormControl<boolean>(true, {nonNullable: true}),
        estimatedCost: costEstimateForm()
    });
}

export function resourceDisposalFromFormValue(form: ResourceDisposalForm): ResourceDisposal {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    const description = form.value.type === 'other'
        ? form.value.description!
        : form.value.type!;

    const estimatedCost = form.value.hasCostEstimates 
        ? costEstimatesFromFormValue(form.controls.estimatedCost)
        : null;
    return new ResourceDisposal({
        description,
        estimatedCost
    });
}

export function patchResourceStorageFormValue(form: ResourceDisposalForm, storage: ResourceDisposal, options?: any) {
    form.patchValue({
        type: storage.type,
        description: storage.description,
        hasCostEstimates: storage.estimatedCost != null,
        estimatedCost: storage.estimatedCost || {}
    }, options);
}
