import {validate as validateIsUUID} from 'uuid';
import { EquipmentRequest, equipmentRequestFromJson, isEquipmentRequest } from './request/equipment-request';
import { Equipment, equipmentParamsFromJson } from './common/equipment';

export type EquipmentLike = Equipment | EquipmentRequest | string;

export function equipmentLikeFromJson(obj: unknown): EquipmentLike {
    if (typeof obj === 'string') {
        if (!validateIsUUID(obj)) {
            throw new Error('Expected a UUID');
        }
        return obj;
    } else if (typeof obj === 'object') {
        try {
            return equipmentParamsFromJson(obj)
        } catch {
            return equipmentRequestFromJson(obj);
        }
    } else {
        throw new Error('Expected a json object');
    }
}

export function equipmentLikeToJson(equipment: EquipmentLike): unknown {
    if (equipment instanceof Equipment) {
        return equipment.id;
    } else {
        return equipment;
    }
}