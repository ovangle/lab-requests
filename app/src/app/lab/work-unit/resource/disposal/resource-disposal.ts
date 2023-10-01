import { ThisReceiver } from "@angular/compiler";
import { FormControl, FormGroup, Validators } from "@angular/forms";
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

export class ResourceDisposal {
    readonly type: ResourceDisposalType;
    readonly otherDescription: string;

    readonly costEstimate: CostEstimate | null;

    constructor(params: Partial<ResourceDisposal>) {
        this.type = params.type || 'general';

        this.otherDescription = params.otherDescription || '';
        this.costEstimate = params.costEstimate || null;
    }

    get typeName(): string {
        if (this.type === 'other') {
            return this.otherDescription;
        }
        return this.type;
    }
}

export function resourceDisposalFromJson(json: {[k: string]: any}): ResourceDisposal {
    return new ResourceDisposal({
        type: json['type'],
        otherDescription: json['otherDescription'],
        costEstimate: json['costEstimate'] ? costEstimateFromJson(json['costEstimate']) : null
    });
}


export function resourceDisposalToJson(disposal: ResourceDisposal): {[k: string]: any} {
    return {
        type: disposal.type,
        otherDescription: disposal.otherDescription,
        costEstimate: disposal.costEstimate && costEstimateToJson(disposal.costEstimate)
    }
}

export type ResourceDisposalForm = FormGroup<{
    type: FormControl<ResourceDisposalType>;
    otherDescription: FormControl<string>;
    estimatedCost: FormControl<number>;
}>;

export function createResourceDisposalForm(r: Partial<ResourceDisposal>): ResourceDisposalForm {
    return new FormGroup({
        type: new FormControl<ResourceDisposalType>(
            r.type || 'general',
            {nonNullable: true, validators: Validators.required}
        ),
        otherDescription: new FormControl<string>(
            r.otherDescription || '',
            {nonNullable: true}
        ),
        estimatedCost: new FormControl<number>(
            r.costEstimate?.estimatedCost || 0,
            {nonNullable: true}
        )
    });
}