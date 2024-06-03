import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelQuery } from 'src/app/common/model/model';
import {
  Equipment,
  EquipmentCreateRequest,
  equipmentCreateRequestToJsonObject,
  equipmentFromJsonObject,
  EquipmentService,
  isEquipmentCreateRequest,
} from 'src/app/equipment/equipment';
import {
  CreateEquipmentProvisionRequest,
  EquipmentProvision,
  equipmentProvisionFromJsonObject
} from 'src/app/equipment/provision/equipment-provision';
import { Resource, ResourceParams, resourceParamsFromJsonObject, ResourcePatch, resourcePatchToJsonObject, ResourceService } from '../../resource';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from 'src/app/equipment/installation/equipment-installation';
import { Lab, LabService } from 'src/app/lab/lab';
import { firstValueFrom } from 'rxjs';
import { formatISO } from 'date-fns';

export interface EquipmentLeaseParams extends ResourceParams {
  lab: Lab | string;

  equipment: Equipment;
  equipmentProvision: EquipmentProvision | null;
  equipmentTrainingCompleted: ReadonlySet<string>;
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: number | null;
}

export class EquipmentLease extends Resource {
  override readonly type = 'equipment_lease';

  equipment: Equipment;
  equipmentProvision: EquipmentProvision | null;

  equipmentTrainingCompleted: string[];
  /**
   * Is a supervisor required in order to provide additional
   * instruction in the usage of this equipment
   */
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: number | null;

  constructor(params: EquipmentLeaseParams) {
    super(params);

    if (!(params.equipment instanceof Equipment)) {
      throw new Error('Lease equipment must exist');
    }

    this.equipment = params.equipment;
    this.equipmentProvision = params.equipmentProvision;

    this.equipmentTrainingCompleted = Array.from(
      params.equipmentTrainingCompleted! || [],
    );
    this.requireSupervision = params.requireSupervision!;
    this.setupInstructions = params.setupInstructions!;
    this.usageCostEstimate = params.usageCostEstimate || null;
  }
}

export function equipmentLeaseFromJsonObject(json: JsonObject): EquipmentLease {
  const resourceParams = resourceParamsFromJsonObject(json);

  if (!isJsonObject(json['equipment'])) {
    throw new Error("Expected a json object 'equipment'");
  }
  const equipment = equipmentFromJsonObject(json['equipment']);

  if (!isJsonObject(json['equipmentProvision']) && json['equipmentProvision'] !== null) {
    throw new Error("Expected a json object or null 'equipmentProvision'");
  }
  const equipmentProvision = json['equipmentProvision'] && equipmentProvisionFromJsonObject(json['equipmentProvision']);

  if (!Array.isArray(json['equipmentTrainingCompleted']) || !json['equipmentTrainingCompleted'].every(o => typeof o === 'string')) {
    throw new Error("Expected a list of strings 'equipmentTrainingCompleted'");
  }
  if (typeof json['requireSupervision'] !== 'boolean') {
    throw new Error("Expected a boolean 'requireSupervision")
  }

  if (typeof json['setupInstructions'] !== 'string') {
    throw new Error("Expected a string 'setupInstructions'");
  }

  if (typeof json['usageCostEstimate'] !== 'number' && json['usageCostEstimate'] !== null) {
    throw new Error("Expected a json object 'usageCostEstimate'")
  }

  return new EquipmentLease({
    ...resourceParams,
    equipment,
    equipmentProvision,
    equipmentTrainingCompleted: new Set(json['equipmentTrainingCompleted']),
    requireSupervision: json['requireSupervision'],
    setupInstructions: json['setupInstructions'],
    usageCostEstimate: json['usageCostEstimate'],
  });
}

export interface EquipmentLeasePatch extends ResourcePatch {
  equipment: EquipmentCreateRequest | Equipment;

  // The pending provision before this lease can begin.
  equipmentProvision: EquipmentProvision | CreateEquipmentProvisionRequest | null;

  startDate: Date | null;
  endDate: Date | null;

  equipmentTrainingCompleted: Set<string>;
  requireSupervision: boolean;
  setupInstructions: string;

  usageCostEstimate: number;
}

export function equipmentLeasePatchToJsonObject(committed: EquipmentLease | null, patch: EquipmentLeasePatch): JsonObject {
  let json: JsonObject = {
    ...resourcePatchToJsonObject(patch)
  };

  if (patch.equipment instanceof Equipment) {
    json['equipment'] = patch.equipment.id;
  } else if (isEquipmentCreateRequest(patch.equipment)) {
    json['equipment'] = equipmentCreateRequestToJsonObject(patch.equipment)
  }

  if (patch.equipmentProvision instanceof EquipmentProvision) {
    json['equipmentProvision'] = patch.equipmentProvision.id
  } else if (isJsonObject(patch.equipmentProvision)) {
    json['equipmentProvision'] = patch.equipmentProvision;
  }

  json['startDate'] = patch.startDate != null ? formatISO(patch.startDate, { representation: "date" }) : null;
  json['endDate'] = patch.endDate != null ? formatISO(patch.endDate, { representation: "date" }) : null;

  json['equipmentTrainingCompleted'] = patch.equipmentTrainingCompleted;
  json['requireSupervision'] = patch.requireSupervision;
  json['setupInstructions'] = patch.setupInstructions;

  return json;
}

@Injectable()
export class EquipmentLeaseService extends ResourceService<EquipmentLease, EquipmentLeasePatch> {
  override resourceType: 'equipment_lease' = 'equipment_lease';
  override patchToJsonObject(current: EquipmentLease | null, patch: EquipmentLeasePatch): JsonObject {
    return equipmentLeasePatchToJsonObject(current, patch)
  }
  override readonly modelFromJsonObject = equipmentLeaseFromJsonObject;
  override setModelQueryParams(params: HttpParams, query: ModelQuery<EquipmentLease>): HttpParams {
    throw new Error('Method not implemented.');
  }
}