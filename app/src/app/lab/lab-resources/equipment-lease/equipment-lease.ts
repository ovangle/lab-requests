import { validate as validateIsUUID } from 'uuid';

import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/research/funding/cost-estimate/cost-estimate';
import {
  Equipment,
  equipmentFromJsonObject,
  EquipmentService,
} from 'src/app/equipment/equipment';
import {
  LabEquipmentProvision,
  labEquipmentProvisionFromJsonObject
} from 'src/app/equipment/provision/equipment-provision';
import { Resource, ResourceParams, resourceParamsFromJsonObject } from '../../lab-resource/resource';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

export interface EquipmentLeaseParams extends ResourceParams {
  equipment: Equipment;
  equipmentProvision: LabEquipmentProvision | null;
  equipmentTrainingCompleted: ReadonlySet<string>;
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: CostEstimate | null;
}

export class EquipmentLease extends Resource {
  override readonly type = 'equipment-lease';

  equipment: Equipment;
  equipmentProvision: LabEquipmentProvision | null;

  equipmentTrainingCompleted: string[];
  /**
   * Is a supervisor required in order to provide additional
   * instruction in the usage of this equipment
   */
  requireSupervision: boolean;

  setupInstructions: string;
  usageCostEstimate: CostEstimate | null;

  constructor(params: EquipmentLeaseParams) {
    super(params);

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
  const equipmentProvision = json[ 'equipmentProvision' ] && labEquipmentProvisionFromJsonObject(json[ 'equipmentProvision' ]);

  if (!Array.isArray(json[ 'equipmentTrainingCompleted' ]) || !json[ 'equipmentTrainingCompleted' ].every(o => typeof o === 'string')) {
    throw new Error("Expected a list of strings 'equipmentTrainingCompleted'");
  }
  if (typeof json[ 'requireSupervision' ] !== 'boolean') {
    throw new Error("Expected a boolean 'requireSupervision")
  }

  if (typeof json[ 'setupInstructions' ] !== 'string') {
    throw new Error("Expected a string 'setupInstructions'");
  }


  return new EquipmentLease({
    ...resourceParams,
    equipment,
    equipmentProvision,
    equipmentTrainingCompleted: new Set(json[ 'equipmentTrainingCompleted' ]),
    requireSupervision: json[ 'requireSupervision' ],
    setupInstructions: json[ 'setupInstructions' ],
    usageCostEstimate: json[ 'usageCostEstimate' ]
      ? costEstimateFromJson(json[ 'usageCostEstimate' ])
      : null,
  });
}

export function equipmentLeaseParamsToJson(lease: EquipmentLeaseParams): {
  [ k: string ]: any;
} {
  let equipment;
  if (lease.equipment instanceof Equipment) {
    equipment = lease.equipment.id;
  } else {
    equipment = lease.equipment;
  }

  return {
    id: lease.id,
    index: lease.index,
    equipment: (lease.equipment),
    equipmentTrainingCompleted: lease.equipmentTrainingCompleted,
    requireSupervision: lease.requireSupervision,
    setupInstructions: lease.setupInstructions,
    usageCostEstimate:
      lease.usageCostEstimate && costEstimateToJson(lease.usageCostEstimate),
  };
}
