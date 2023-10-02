import { FormControl, FormGroup } from "@angular/forms";

export interface CostEstimate {
    isUniversitySupplied: boolean;
    estimatedCost: number;
}

export function costEstimateFromJson(json: {[k: string]: any}): CostEstimate {
    return { 
        isUniversitySupplied: json['isUniversitySupplied'],
        estimatedCost: json['estimatedCost'],
    }
}

export function costEstimateToJson(cost: CostEstimate) {
    const result: {[k: string]: any} = {
        isUniversitySupplied: cost.isUniversitySupplied,
        estimatedCost: cost.estimatedCost,
    };
    return result;
}
