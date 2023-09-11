import { Equipment, EquipmentPatch, equipmentFromJson, equipmentPatchToJson, isEquipmentPatch } from "src/app/lab/equipment/equipment";
import { Resource, CostEstimate, CostEstimateForm, costEstimateForm, costEstimateFromJson, costEstimateToJson } from "../common/resource";
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

export function equipmentLeaseFromJson(json: {[k: string]: any}): EquipmentLease {
    return new EquipmentLease({
        equipment: equipmentFromJson(json['equipment']),
        isTrainingCompleted: json['isTrainingCompleted'],
        requiresAssistance: json['requiresAssistance'],
        setupInstructions: json['setupInstructions'],
        usageCostEstimate: json['usageCostEstimate'] ? costEstimateFromJson(json['usageCostEstimate']) : null
    });
}

export function equipmentLeaseToJson(lease: EquipmentLease): {[k: string]: any} {
    let equipment;
    if (lease.equipment instanceof Equipment) {
        equipment = lease.equipment.id;
    } else if (isEquipmentPatch(lease.equipment)) {
        equipment = equipmentPatchToJson(lease.equipment);
    } else {
        equipment = lease.equipment;
    }

    return {
        equipment,
        isTrainingCompleted: lease.isTrainingCompleted,
        requiresAssistance: lease.requiresAssistance,
        setupInstructions: lease.setupInstructions,
        usageCostEstimate: lease.usageCostEstimate && costEstimateToJson(lease.usageCostEstimate)
    }
}

export type EquipmentLeaseForm = FormGroup<{
    equipment: FormControl<Equipment | EquipmentPatch | null>;
    isTrainingCompleted: FormControl<boolean>;
    requiresAssistance: FormControl<boolean>;

    setupInstructions: FormControl<string>;
    usageCostEstimate: CostEstimateForm
}>;

export function equipmentLeaseForm(lease?: Partial<EquipmentLease>): EquipmentLeaseForm {
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