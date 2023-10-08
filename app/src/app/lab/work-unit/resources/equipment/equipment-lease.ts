import { validate as validateIsUUID } from 'uuid';

import { Equipment, EquipmentModelService, EquipmentPatch, EquipmentRequest, equipmentFromJson, equipmentPatchToJson, isEquipmentPatch } from "src/app/lab/equipment/equipment";
import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from "@angular/forms";
import { Resource, ResourceParams } from "../../resource/resource";
import { firstValueFrom } from 'rxjs';
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from 'src/app/uni/research/funding/cost-estimate/coste-estimate';
import { ResourceFileAttachment, resourceFileAttachmentFromJson, resourceFileAttachmentToJson } from '../../resource/file-attachment/file-attachment';

export interface EquipmentLeaseParams extends ResourceParams<EquipmentLease> {
    equipment: Equipment | EquipmentRequest | string;
    equipmentTrainingCompleted?: string[];
    requiresAssistance?: boolean;

    setupInstructions?: string;

    usageCostEstimate: CostEstimate | null;
}


export class EquipmentLease extends Resource {
    override readonly type = 'equipment';

    equipment: Equipment | EquipmentRequest | string;

    equipmentTrainingCompleted: string[];
    requiresAssistance: boolean;

    setupInstructions: string;
    usageCostEstimate: CostEstimate | null;

    constructor(params: EquipmentLeaseParams) {
        super(params);

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

    const attachments = Array.from(json['attachments'] || [])
        .map((value) => resourceFileAttachmentFromJson(value));

    return new EquipmentLease({
        containerId: json['containerId'],
        id: json['id'],
        index: json['index'],
        equipment,
        equipmentTrainingCompleted: json['equipmentTrainingCompleted'],
        requiresAssistance: json['requiresAssistance'],
        setupInstructions: json['setupInstructions'],
        usageCostEstimate: json['usageCostEstimate'] ? costEstimateFromJson(json['usageCostEstimate']) : null,
        attachments
    });
}

export function equipmentLeaseParamsToJson(lease: EquipmentLeaseParams): {[k: string]: any} {
    let equipment;
    if (lease.equipment instanceof Equipment) {
        equipment = lease.equipment.id;
    } else if (isEquipmentPatch(lease.equipment)) {
        equipment = equipmentPatchToJson(lease.equipment);
    } else {
        equipment = lease.equipment;
    }

    return {
        containerId: lease.containerId,
        id: lease.id,
        index: lease.index,
        equipment,
        equipmentTrainingCompleted: lease.equipmentTrainingCompleted,
        requiresAssistance: lease.requiresAssistance,
        setupInstructions: lease.setupInstructions,
        usageCostEstimate: lease.usageCostEstimate && costEstimateToJson(lease.usageCostEstimate)
    }
}
