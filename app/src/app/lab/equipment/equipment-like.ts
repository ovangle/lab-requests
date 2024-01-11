import { validate as validateIsUUID } from 'uuid';
import {
  EquipmentRequest,
  equipmentRequestFromJson,
  isEquipmentRequest,
} from './request/equipment-request';
import { Equipment, equipmentFromJsonObject } from './common/equipment';
import { isJsonObject } from 'src/app/utils/is-json-object';

export type EquipmentLike = Equipment | EquipmentRequest | string;

export function equipmentLikeFromJson(obj: unknown): EquipmentLike {
  if (typeof obj === 'string') {
    if (!validateIsUUID(obj)) {
      throw new Error('Expected a UUID');
    }
    return obj;
  } else if (isJsonObject(obj)) {
    try {
      return equipmentFromJsonObject(obj);
    } catch {
      return equipmentRequestFromJson(obj);
    }
  } else {
    throw new Error('Expected a json object or uuid');
  }
}

export function equipmentLikeToJson(equipment: EquipmentLike): unknown {
  if (equipment instanceof Equipment) {
    return equipment.id;
  } else {
    return equipment;
  }
}
