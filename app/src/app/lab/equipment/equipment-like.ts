import { validate as validateIsUUID } from 'uuid';
import { Equipment, equipmentFromJsonObject } from './equipment';
import { isJsonObject } from 'src/app/utils/is-json-object';
import { LabEquipmentProvision, labEquipmentProvisionFromJsonObject } from './provision/lab-equipment-provision';

export type EquipmentLike = Equipment | LabEquipmentProvision | string;

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
      return labEquipmentProvisionFromJsonObject(obj);
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
