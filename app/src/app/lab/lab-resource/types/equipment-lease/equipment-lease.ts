import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { ModelQuery } from 'src/app/common/model/model';
import {
  Equipment,
  EquipmentCreateRequest,
  equipmentFromJsonObject,
  EquipmentService,
} from 'src/app/equipment/equipment';
import {
  EquipmentProvision,
  equipmentProvisionFromJsonObject
} from 'src/app/equipment/provision/equipment-provision';
import { Resource, ResourceParams, resourceParamsFromJsonObject, ResourcePatch, ResourceService } from '../../resource';

export interface EquipmentLeaseParams extends ResourceParams {
  equipment: Equipment | EquipmentCreateRequest;
  equipmentProvision: EquipmentProvision | null;
  equipmentTrainingCompleted: ReadonlySet<string>;
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: number | null;
}

export class EquipmentLease extends Resource {
  override readonly type = 'equipment-lease';

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
      throw new Error("Patch must be created on server");
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

export function equipmentLeaseFromJson(json: JsonObject): EquipmentLease {
  const resourceParams = resourceParamsFromJsonObject(json);

  if (!isJsonObject(json[ 'equipment' ])) {
    throw new Error("Expected a json object 'equipment'");
  }
  const equipment = equipmentFromJsonObject(json[ 'equipment' ]);
  if (!isJsonObject(json[ 'equipmentProvision' ]) && json[ 'equipmentProvision' ] !== null) {
    throw new Error("Expected a json object or null 'equipmentProvision'");
  }
  const equipmentProvision = json[ 'equipmentProvision' ] && equipmentProvisionFromJsonObject(json[ 'equipmentProvision' ]);

  if (!Array.isArray(json[ 'equipmentTrainingCompleted' ]) || !json[ 'equipmentTrainingCompleted' ].every(o => typeof o === 'string')) {
    throw new Error("Expected a list of strings 'equipmentTrainingCompleted'");
  }
  if (typeof json[ 'requireSupervision' ] !== 'boolean') {
    throw new Error("Expected a boolean 'requireSupervision")
  }

  if (typeof json[ 'setupInstructions' ] !== 'string') {
    throw new Error("Expected a string 'setupInstructions'");
  }

  if (typeof json[ 'usageCostEstimate' ] !== 'number' && json[ 'usageCostEstimate' ] !== null) {
    throw new Error("Expected a json object 'usageCostEstimate'")
  }

  return new EquipmentLease({
    ...resourceParams,
    equipment,
    equipmentProvision,
    equipmentTrainingCompleted: new Set(json[ 'equipmentTrainingCompleted' ]),
    requireSupervision: json[ 'requireSupervision' ],
    setupInstructions: json[ 'setupInstructions' ],
    usageCostEstimate: json[ 'usageCostEstimate' ],
  });
}

export interface EquipmentLeasePatch extends ResourcePatch<EquipmentLease> {
  equipment: Equipment | EquipmentCreateRequest;
  equipmentProvision: EquipmentProvision | null;

  equipmentTrainingCompleted: Set<string>;
  requireSupervision: boolean;
  setupInstructions: string;

  usageCostEstimate: number;
}

export function equipmentLeasePatchToJsonObject(committed: EquipmentLease | null, patch: Partial<EquipmentLeasePatch>): JsonObject {
  let json: JsonObject = {};

  if (patch.equipment instanceof Equipment) {
    json[ 'equipment' ] = patch.equipment.id;
  } else if (patch.equipment) {
    json[ 'equipment' ] = patch.equipment;
  } else if (committed?.equipment) {
    json[ 'equipment' ] = committed.equipment.id;
  }
  json[ 'equipmentTrainingCompleted' ] = patch.equipmentTrainingCompleted;
  json[ 'requireSupervision' ] = patch.requireSupervision;

  return json;
}

@Injectable()
export class EquipmentLeaseService extends ResourceService<EquipmentLease, EquipmentLeasePatch> {
  override resourceType: 'equipment-lease' = 'equipment-lease';
  override resourcePatchToJson(current: EquipmentLease | null, patch: Partial<EquipmentLeasePatch>): JsonObject {
    return equipmentLeasePatchToJsonObject(current, patch)
  }
  override modelFromJsonObject(json: JsonObject): EquipmentLease {
    return equipmentLeaseFromJson(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<EquipmentLease>): HttpParams {
    throw new Error('Method not implemented.');
  }
}