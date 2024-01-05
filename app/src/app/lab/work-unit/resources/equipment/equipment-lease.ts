import { validate as validateIsUUID } from 'uuid';

import { Resource, ResourceParams } from "../../resource/resource";
import { firstValueFrom } from 'rxjs';
import { resourceFileAttachmentFromJson } from '../../resource/file-attachment/file-attachment';
import { CostEstimate, costEstimateFromJson, costEstimateToJson } from 'src/app/uni/research/funding/cost-estimate/cost-estimate';
import { Equipment, EquipmentService } from 'src/app/lab/equipment/common/equipment';
import { equipmentRequestToJson, isEquipmentRequest } from 'src/app/lab/equipment/request/equipment-request';
import { EquipmentLike, equipmentLikeFromJson, equipmentLikeToJson } from 'src/app/lab/equipment/equipment-like';

export interface EquipmentLeaseParams extends ResourceParams {
    equipment: EquipmentLike;
    equipmentTrainingCompleted?: string[];
    requiresAssistance?: boolean;

    setupInstructions?: string;

    usageCostEstimate: CostEstimate | null;
}


export class EquipmentLease extends Resource<EquipmentLeaseParams> {
    override readonly type = 'equipment';

    equipment: EquipmentLike;

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

    async resolveEquipment(equipments: EquipmentService): Promise<EquipmentLease> {
        if (typeof this.equipment === 'string') {
            const equipment = await firstValueFrom(equipments.fetch(this.equipment));
            return new EquipmentLease({ ...this, equipment });
        }
        return this;
    }
    get isEquipmentResolved() {
        return typeof this.equipment !== 'string';
    }
}

export function equipmentLeaseFromJson(json: { [k: string]: any }): EquipmentLease {
    const jsonEquipment = json['equipment'];
    const equipment = typeof jsonEquipment === 'string'
        ? jsonEquipment
        : equipmentLikeFromJson(jsonEquipment);

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

export function equipmentLeaseParamsToJson(lease: EquipmentLeaseParams): { [k: string]: any } {
    let equipment;
    if (lease.equipment instanceof Equipment) {
        equipment = lease.equipment.id;
    } else if (isEquipmentRequest(lease.equipment)) {
        equipment = equipmentRequestToJson(lease.equipment);
    } else {
        equipment = lease.equipment;
    }

    return {
        containerId: lease.containerId,
        id: lease.id,
        index: lease.index,
        equipment: equipmentLikeToJson(lease.equipment),
        equipmentTrainingCompleted: lease.equipmentTrainingCompleted,
        requiresAssistance: lease.requiresAssistance,
        setupInstructions: lease.setupInstructions,
        usageCostEstimate: lease.usageCostEstimate && costEstimateToJson(lease.usageCostEstimate)
    }
}
