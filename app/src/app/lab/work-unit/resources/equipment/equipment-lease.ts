import { Equipment, EquipmentPatch, equipmentFromJson, equipmentPatchToJson, isEquipmentPatch } from "src/app/lab/equipment/equipment";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Resource, CostEstimate, costEstimateFromJson, costEstimateToJson, CostEstimateForm, costEstimateForm, ResourceParams } from "../../resource/resource";

export interface EquipmentLeaseParams extends ResourceParams<EquipmentLease> {}


export class EquipmentLease implements Resource {
    readonly type = 'equipment';

    readonly planId: string;
    readonly workUnitId: string;

    readonly index: number | 'create'; 
    equipment: Equipment | EquipmentPatch;

    isTrainingCompleted: boolean;
    requiresAssistance: boolean;

    setupInstructions: string;
    usageCostEstimate: CostEstimate | null;

    constructor(params: EquipmentLeaseParams) {
        this.planId = params.planId;
        this.workUnitId = params.workUnitId;
        this.index = params.index;
        this.equipment = params.equipment!;
        this.isTrainingCompleted = params.isTrainingCompleted!;
        this.requiresAssistance = params.requiresAssistance!;
        this.setupInstructions = params.setupInstructions!;
        this.usageCostEstimate = params.usageCostEstimate || null;
    }
}

export function equipmentLeaseFromJson(json: {[k: string]: any}): EquipmentLease {
    return new EquipmentLease({
        planId: json['planId']!,
        workUnitId: json['workUnitId'],
        index: json['index'],
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
        planId: lease.planId,
        workUnitId: lease.workUnitId,
        index: lease.index,
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
    usageCostEstimate: AbstractControl<CostEstimate | null>;
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
        usageCostEstimate: costEstimateForm(lease?.usageCostEstimate || undefined) as AbstractControl<CostEstimate | null>
    });
}

export type EquipmentLeaseFormErrors = ValidationErrors & {
    equipment?: { required: string | null; };
}