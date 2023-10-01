import { FormControl, FormGroup } from "@angular/forms";
import { CostEstimate } from "./coste-estimate";

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