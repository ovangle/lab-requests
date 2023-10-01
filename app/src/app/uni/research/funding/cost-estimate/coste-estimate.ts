import { FormControl, FormGroup } from "@angular/forms";

export interface CostEstimate {
    isUniversitySupplied: boolean;
    estimatedCost: number;
}

export function costEstimateFromJson(json: {[k: string]: any}): CostEstimate {
    return { 
        isUniversitySupplied: json['isUniversitySupplied'],
        estimatedCost: json['estimatedCost']
    }
}

export function costEstimateToJson(cost: CostEstimate) {
    return {
        isUniversitySupplied: cost.isUniversitySupplied,
        estimatedCost: cost.estimatedCost
    };
}

export type CostEstimateForm = FormGroup<{
    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function costEstimateForm(initial?: CostEstimate): CostEstimateForm {
    return new FormGroup({
        isUniversitySupplied: new FormControl(!!initial?.isUniversitySupplied, {nonNullable: true}),
        estimatedCost: new FormControl(initial?.estimatedCost || 0, {nonNullable: true})
    });
}