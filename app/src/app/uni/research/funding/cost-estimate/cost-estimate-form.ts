import { FormControl, FormGroup } from "@angular/forms";
import { CostEstimate } from "./coste-estimate";

export type CostEstimateForm = FormGroup<{
    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function costEstimateForm(): CostEstimateForm {
    return new FormGroup({
        isUniversitySupplied: new FormControl(true, {nonNullable: true}),
        estimatedCost: new FormControl(0, {nonNullable: true}),
    });
}

export function costEstimatesFromFormValue(form: CostEstimateForm): CostEstimate {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    return {
        isUniversitySupplied: !!form.value.isUniversitySupplied,
        estimatedCost: form.value.estimatedCost!
    };
}