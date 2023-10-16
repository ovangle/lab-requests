import { CostEstimate, costEstimateFromJson, costEstimateToJson } from "src/app/uni/research/funding/cost-estimate/cost-estimate";

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


export function resourceStorageParamsToJson(storage: ResourceStorageParams): {[k: string]: any} {
    return {
        description: storage.description,
        estimatedCost: storage.estimatedCost && costEstimateToJson(storage.estimatedCost)
    };
}

