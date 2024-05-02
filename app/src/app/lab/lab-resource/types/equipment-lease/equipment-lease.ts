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
  CreateEquipmentProvisionRequest,
  EquipmentProvision,
  equipmentProvisionFromJsonObject
} from 'src/app/equipment/provision/equipment-provision';
import { Resource, ResourceParams, resourceParamsFromJsonObject, ResourcePatch, resourcePatchToJsonObject, ResourceService } from '../../resource';
import { EquipmentInstallation, equipmentInstallationFromJsonObject } from 'src/app/equipment/installation/equipment-installation';
import { Lab, LabService } from 'src/app/lab/lab';
import { firstValueFrom } from 'rxjs';

export interface EquipmentLeaseParams extends ResourceParams {
  lab: Lab | string;

  equipment: Equipment;
  equipmentInstallation: EquipmentInstallation;
  equipmentProvision: EquipmentProvision | null;
  equipmentTrainingCompleted: ReadonlySet<string>;
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: number | null;
}

export class EquipmentLease extends Resource {
  override readonly type = 'equipment_lease';

  lab: Lab | string;

  equipment: Equipment;
  equipmentInstallation: EquipmentInstallation | null;
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

    this.lab = params.lab;

    this.equipment = params.equipment;
    this.equipmentInstallation = params.equipmentInstallation;
    this.equipmentProvision = params.equipmentProvision;

    this.equipmentTrainingCompleted = Array.from(
      params.equipmentTrainingCompleted! || [],
    );
    this.requireSupervision = params.requireSupervision!;
    this.setupInstructions = params.setupInstructions!;
    this.usageCostEstimate = params.usageCostEstimate || null;
  }

  async resolveLab(service: LabService) {
    if (typeof this.lab === 'string') {
      this.lab = await firstValueFrom(service.fetch(this.lab));
    }
    return this.lab;
  }
}

export function equipmentLeaseFromJson(json: JsonObject): EquipmentLease {
  const resourceParams = resourceParamsFromJsonObject(json);


  if (!isJsonObject(json[ 'equipment' ])) {
    throw new Error("Expected a json object 'equipment'");
  }
  const equipment = equipmentFromJsonObject(json[ 'equipment' ]);
  if (!isJsonObject(json[ 'equipmentInstallation' ])) {
    throw new Error("Expected a json object 'equipmentInstallation'")
  }
  const equipmentInstallation = equipmentInstallationFromJsonObject(json[ 'equipmentInstallation' ]);

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
    equipmentInstallation,
    equipmentProvision,
    equipmentTrainingCompleted: new Set(json[ 'equipmentTrainingCompleted' ]),
    requireSupervision: json[ 'requireSupervision' ],
    setupInstructions: json[ 'setupInstructions' ],
    usageCostEstimate: json[ 'usageCostEstimate' ],
  });
}

export interface EquipmentLeasePatch extends ResourcePatch {
  equipment: EquipmentCreateRequest | Equipment | null;
  equipmentInstallation: EquipmentInstallation | null;
  equipmentProvision: EquipmentProvision | CreateEquipmentProvisionRequest | null;

  equipmentTrainingCompleted: Set<string>;
  requireSupervision: boolean;
  setupInstructions: string;

  usageCostEstimate: number;
}

export function equipmentLeasePatchToJsonObject(committed: EquipmentLease | null, patch: EquipmentLeasePatch): JsonObject {
  let json: JsonObject = {
    ...resourcePatchToJsonObject(patch)
  };

  if (patch.equipmentInstallation instanceof EquipmentInstallation) {
    json[ 'equipmentInstallation' ] = patch.equipmentInstallation.id;
  } else if (committed != null) {
    json[ 'equipmentInstallation' ] = null;
  }

  if (patch.equipmentProvision instanceof EquipmentProvision) {
    json[ 'equipmentProvision' ] = patch.equipmentProvision.id
  } else if (isJsonObject(patch.equipmentProvision)) {
    json[ 'equipmentProvision' ] = patch.equipmentProvision;
  }

  json[ 'equipmentTrainingCompleted' ] = patch.equipmentTrainingCompleted;
  json[ 'requireSupervision' ] = patch.requireSupervision;
  json[ 'setupInstructions' ] = patch.setupInstructions;

  return json;
}

@Injectable()
export class EquipmentLeaseService extends ResourceService<EquipmentLease, EquipmentLeasePatch> {
  override resourceType: 'equipment_lease' = 'equipment_lease';
  override patchToJsonObject(current: EquipmentLease | null, patch: EquipmentLeasePatch): JsonObject {
    return equipmentLeasePatchToJsonObject(current, patch)
  }
  override modelFromJsonObject(json: JsonObject): EquipmentLease {
    return equipmentLeaseFromJson(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<EquipmentLease>): HttpParams {
    throw new Error('Method not implemented.');
  }
}