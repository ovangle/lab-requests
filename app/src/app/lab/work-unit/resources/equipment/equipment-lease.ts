import { validate as validateIsUUID } from 'uuid';

import { Equipment, EquipmentModelService, EquipmentPatch, EquipmentRequest, equipmentFromJson, equipmentPatchToJson, isEquipmentPatch } from "src/app/lab/equipment/equipment";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Resource, ResourceParams } from "../../resource/resource";
import { firstValueFrom } from 'rxjs';
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from 'src/app/uni/research/funding/cost-estimate/coste-estimate';
import { CostEstimateForm, costEstimateForm } from 'src/app/uni/research/funding/cost-estimate/cost-estimate-form';

export interface EquipmentLeaseParams extends ResourceParams<EquipmentLease> {
    equipment: Equipment | EquipmentRequest | string;
    equipmentTrainingCompleted?: string[];
    requiresAssistance?: boolean;

    setupInstructions?: string;

    usageCostEstimate: CostEstimate | null;
}


export class EquipmentLease implements Resource {
    readonly type = 'equipment';

    readonly planId: string;
    readonly workUnitId: string;

    readonly index: number | 'create'; 
    equipment: Equipment | EquipmentRequest | string;

    equipmentTrainingCompleted: string[];
    requiresAssistance: boolean;

    setupInstructions: string;
    usageCostEstimate: CostEstimate | null;

    constructor(params: EquipmentLeaseParams) {
        this.planId = params.planId;
        this.workUnitId = params.workUnitId;
        this.index = params.index;

        if (typeof params.equipment === 'string') {
            validateIsUUID(params.equipment);
        } else if (typeof params.equipment !== 'object' || params.equipment == null) {
            throw new Error('Equipment must be an object or uuid');
        }
        this.equipment = params.equipment;

        this.equipmentTrainingCompleted = Array.from(params.equipmentTrainingCompleted! || []);
        this.requiresAssistance = params.requiresAssistance!;
        this.setupInstructions = params.setupInstructions!;
        this.usageCostEstimate = params.usageCostEstimate || null;
    }

    async resolveEquipment(equipments: EquipmentModelService): Promise<EquipmentLease> {
        if (typeof this.equipment === 'string') {
            const equipment = await firstValueFrom(equipments.fetch(this.equipment));
            return new EquipmentLease({...this, equipment});
        }
        return this;
    }
    get isEquipmentResolved() {
        return typeof this.equipment !== 'string';
    }
}

export function equipmentLeaseFromJson(json: {[k: string]: any}): EquipmentLease {
    const jsonEquipment = json['equipment'];
    const equipment = typeof jsonEquipment === 'string'
            ? jsonEquipment
            : equipmentFromJson(jsonEquipment);

    return new EquipmentLease({
        planId: json['planId']!,
        workUnitId: json['workUnitId'],
        index: json['index'],
        equipment,
        equipmentTrainingCompleted: json['equipmentTrainingCompleted'],
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
        equipmentTrainingCompleted: lease.equipmentTrainingCompleted,
        requiresAssistance: lease.requiresAssistance,
        setupInstructions: lease.setupInstructions,
        usageCostEstimate: lease.usageCostEstimate && costEstimateToJson(lease.usageCostEstimate)
    }
}

export type EquipmentLeaseForm = FormGroup<{
    equipment: FormControl<Equipment | EquipmentRequest | null>;
    equipmentTrainingCompleted: FormControl<string[]>;
    requiresAssistance: FormControl<boolean>;

    setupInstructions: FormControl<string>;
    usageCostEstimate: CostEstimateForm;
}>;

export function equipmentLeaseForm(lease?: Partial<EquipmentLease>): EquipmentLeaseForm {
    return new FormGroup({
        equipment: new FormControl<Equipment | EquipmentRequest | null>(
            lease?.equipment || null as any, 
            { validators: [Validators.required] }
        ),
        equipmentTrainingCompleted: new FormControl<string[]>(
            lease?.equipmentTrainingCompleted|| [], 
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
        usageCostEstimate: costEstimateForm()
    });
}

export type EquipmentLeaseFormErrors = ValidationErrors & {
    equipment?: { required: string | null; };
}