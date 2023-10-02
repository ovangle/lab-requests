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
