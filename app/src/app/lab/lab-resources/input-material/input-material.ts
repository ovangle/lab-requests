import {
  CostEstimate,
  costEstimateFromJson,
  costEstimateToJson,
} from 'src/app/research/funding/cost-estimate/cost-estimate';
import {
  HazardClass,
  hazardClassesFromJson,
  hazardClassesToJson,
} from '../../lab-resource/hazardous/hazardous';
import { ResourceParams, Resource, resourceParamsFromJsonObject } from '../../lab-resource/resource';
import {
  ResourceStorage,
  ResourceStorageParams,
  resourceStorageFromJson,
  resourceStorageParamsToJson,
} from '../../lab-resource/storage/resource-storage';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

export interface InputMaterialParams extends ResourceParams {
  name: string;
  description: string;
  baseUnit: string;

  numUnitsRequired: number;
  perUnitCostEstimate: CostEstimate | null;

  storage: ResourceStorage | ResourceStorageParams;
  hazardClasses?: HazardClass[];
}

export class InputMaterial extends Resource {
  override readonly type = 'input-material';

  name: string;
  description: string;
  baseUnit: string;

  numUnitsRequired: number;

  perUnitCostEstimate: CostEstimate | null;

  storage: ResourceStorage;
  hazardClasses: HazardClass[];

  constructor(params: InputMaterialParams) {
    super(params);

    this.name = params.name;
    this.description = params.description;
    this.baseUnit = params.baseUnit;

    this.numUnitsRequired = params.numUnitsRequired || 0;
    this.perUnitCostEstimate = params.perUnitCostEstimate || null;
    this.storage = new ResourceStorage(params.storage);
    this.hazardClasses = params?.hazardClasses || [];
  }
}

export function inputMaterialFromJson(json: JsonObject): InputMaterial {
  const resourceParams = resourceParamsFromJsonObject(json);

  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'")
  }
  if (typeof json[ 'description' ] !== 'string') {
    throw new Error("Expected a string 'description'");
  }
  if (typeof json[ 'baseUnit' ] !== 'string') {
    throw new Error("Expected a string 'baseUnit'");
  }
  if (typeof json[ 'numUnitsRequired' ] !== 'number') {
    throw new Error("Expected a number 'numUnitsRequired");
  }
  if (!isJsonObject(json[ 'perUnitCostEstimate' ]) && json[ 'perUnitCostEstimate' ] !== null) {
    throw new Error("Expected a json object or null 'perUnitCostEstimate'");
  }
  const perUnitCostEstimate = json[ 'perUnitCostEstimate' ] && costEstimateFromJson(json[ 'perUnitCostEstimate' ]);

  if (!isJsonObject(json[ 'storage' ])) {
    throw new Error("Expected a json object 'storage'");
  }
  const storage = resourceStorageFromJson(json[ 'storage' ]);

  if (!Array.isArray(json[ 'hazardClasses' ]) || !json[ 'hazardClasses' ].every(o => typeof o === 'string')) {
    throw new Error("Expected an array of strings 'hazardClasses'");
  }
  const hazardClasses = hazardClassesFromJson(json[ 'hazardClasses' ]);

  return new InputMaterial({
    ...resourceParams,
    name: json[ 'name' ],
    description: json[ 'description' ],
    baseUnit: json[ 'baseUnit' ],
    numUnitsRequired: json[ 'numUnitsRequired' ],
    perUnitCostEstimate,
    storage,
    hazardClasses,
  });
}

export function inputMaterialToJson(inputMaterial: InputMaterial): {
  [ k: string ]: any;
} {
  return {
    id: inputMaterial.id,
    index: inputMaterial.index,
    name: inputMaterial.name,
    baseUnit: inputMaterial.baseUnit,
    numUnitsRequired: inputMaterial.numUnitsRequired,
    perUnitCostEstimate:
      inputMaterial.perUnitCostEstimate &&
      costEstimateToJson(inputMaterial.perUnitCostEstimate),
    storage: resourceStorageParamsToJson(inputMaterial.storage),
    hazardClasses: hazardClassesToJson(inputMaterial.hazardClasses),
  };
}
