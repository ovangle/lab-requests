import { Equipment, EquipmentPatch } from "src/app/lab/equipment/equipment";
import { Resource, CostEstimate, CostEstimateForm, costEstimateForm } from "../common/resource";
import { FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";

export class EquipmentLease implements Resource {
    readonly type = 'equipment';
    equipment: Equipment | EquipmentPatch;

    isTrainingCompleted: boolean;
    requiresAssistance: boolean;

    setupInstructions: string;
    usageCostEstimate: CostEstimate | null;

    constructor(params: Partial<EquipmentLease>) {
        this.equipment = params.equipment!;
        this.isTrainingCompleted = params.isTrainingCompleted!;
        this.requiresAssistance = params.requiresAssistance!;
        this.setupInstructions = params.setupInstructions!;
        this.usageCostEstimate = params.usageCostEstimate || null;
    }
}

export type EquipmentLeaseForm = FormGroup<{
    equipment: FormControl<Equipment | EquipmentPatch | null>;
    isTrainingCompleted: FormControl<boolean>;
    requiresAssistance: FormControl<boolean>;

    setupInstructions: FormControl<string>;
    usageCostEstimate: CostEstimateForm
}>;

export function equipmentLeaseForm(lease?: EquipmentLease): EquipmentLeaseForm {
    return new FormGroup({
        equipment: new FormControl(
            lease?.equipment || null, 
            { validators: [Validators.required] }
        ),
        isTrainingCompleted: new FormControl<boolean>(
            !!(lease?.isTrainingCompleted), 
            {nonNullable: true}
        ),
        requiresAssistance: new FormControl<boolean>(
            !!(lease?.requiresAssistance), 
            {nonNullable: true}
        ),
        setupInstructions: new FormControl<string>(
            lease?.setupInstructions || '', 
            {nonNullable: true}
        ),
        usageCostEstimate: costEstimateForm(lease?.usageCostEstimate)
    });
}

export type EquipmentLeaseFormErrors = ValidationErrors & {
    equipment?: { required: string | null; };
}