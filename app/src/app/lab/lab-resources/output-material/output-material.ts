import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResourceDisposal,
  ResourceDisposalParams,
  resourceDisposalFromJson,
  resourceDisposalParamsToJson,
} from '../../lab-resource/disposal/resource-disposal';
import { resourceFileAttachmentFromJson } from '../../lab-resource/file-attachment/file-attachment';
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

export interface OutputMaterialParams extends ResourceParams {
  name: string;
  baseUnit: string;
  numUnitsProduced: number;
  disposal: ResourceDisposal | ResourceDisposalParams;
  storage: ResourceStorage | ResourceStorageParams;
  hazardClasses: HazardClass[];
}

export class OutputMaterial extends Resource {
  override readonly type = 'output-material';

  name: string;
  baseUnit: string;

  numUnitsProduced: number;

  storage: ResourceStorage;
  disposal: ResourceDisposal;

  hazardClasses: HazardClass[];

  constructor(params: OutputMaterialParams) {
    super(params);

    if (!params.name) {
      throw new Error('Invalid OutputMaterial. Name must be provided');
    }
    this.name = params.name;

    if (!params.baseUnit) {
      throw new Error('Invalid OutputMaterial. Base units must be provided');
    }
    this.baseUnit = params.baseUnit;

    this.numUnitsProduced = params.numUnitsProduced || 0;

    this.storage = new ResourceStorage(params.storage);
    this.disposal = new ResourceDisposal(params.disposal);

    this.hazardClasses = params?.hazardClasses || [];
  }
}

export function outputMaterialFromJson(json: JsonObject): OutputMaterial {
  const resourceParams = resourceParamsFromJsonObject(json);

  if (typeof json[ 'name' ] !== 'string') {
    throw new Error("Expected a string 'name'");
  }
  if (typeof json[ 'baseUnit' ] !== 'string') {
    throw new Error("Expected a string 'baseUnit'");
  }
  if (typeof json[ 'numUnitsProduced' ] !== 'number') {
    throw new Error("Expected a number 'numUnitsProduced'");
  }

  if (!isJsonObject(json[ 'storage' ])) {
    throw new Error("Expected a json object 'storage'");
  }
  const storage = resourceStorageFromJson(json[ 'storage' ]);
  if (!isJsonObject(json[ 'disposal' ])) {
    throw new Error("Expected a json object 'disposal'");
  }
  const disposal = resourceDisposalFromJson(json[ 'disposal' ]);
  if (!Array.isArray(json[ 'hazardClasses' ]) || !json[ 'hazardClasses' ].every(o => typeof o === 'string')) {
    throw new Error("Expected an array of strings 'hazardClasses'");
  }
  const hazardClasses = hazardClassesFromJson(json[ 'hazardClasses' ]);

  return new OutputMaterial({
    ...resourceParams,
    name: json[ 'name' ],
    baseUnit: json[ 'baseUnit' ],
    numUnitsProduced: json[ 'numUnitsProduced' ],
    storage,
    disposal,
    hazardClasses,
  });
}

export function outputMaterialParamsToJson(
  outputMaterial: OutputMaterialParams,
): { [ k: string ]: any } {
  return {
    id: outputMaterial.id,
    name: outputMaterial.name,
    baseUnit: outputMaterial.baseUnit,
    numUnitsProduced: outputMaterial.numUnitsProduced,
    storage: resourceStorageParamsToJson(outputMaterial.storage),
    disposal: resourceDisposalParamsToJson(outputMaterial.disposal),
    hazardClasses: hazardClassesToJson(outputMaterial.hazardClasses),
  };
}
