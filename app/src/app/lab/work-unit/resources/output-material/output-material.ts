import {
  ResourceDisposal,
  ResourceDisposalParams,
  resourceDisposalFromJson,
  resourceDisposalParamsToJson,
} from '../../resource/disposal/resource-disposal';
import {
  ResourceFileAttachment,
  resourceFileAttachmentFromJson,
  resourceFileAttachmentToJson,
} from '../../resource/file-attachment/file-attachment';
import {
  HazardClass,
  hazardClassesFromJson,
  hazardClassesToJson,
} from '../../resource/hazardous/hazardous';
import { Resource, ResourceParams } from '../../resource/resource';
import {
  ResourceStorage,
  ResourceStorageParams,
  resourceStorageFromJson,
  resourceStorageParamsToJson,
} from '../../resource/storage/resource-storage';

export interface OutputMaterialParams extends ResourceParams {
  name: string;
  baseUnit: string;
  numUnitsProduced: number;
  disposal: ResourceDisposal | ResourceDisposalParams;
  storage: ResourceStorage | ResourceStorageParams;
  hazardClasses: HazardClass[];
}

export class OutputMaterial extends Resource<OutputMaterialParams> {
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

export function outputMaterialFromJson(json: {
  [k: string]: any;
}): OutputMaterial {
  const attachments = Array.from(json['attachments'] || []).map(
    resourceFileAttachmentFromJson,
  );

  return new OutputMaterial({
    containerId: json['containerId'],
    id: json['id'],
    index: json['index'],
    name: json['name'],
    baseUnit: json['baseUnit'],
    numUnitsProduced: json['numUnitsProduced'],
    storage: resourceStorageFromJson(json['storage']),
    disposal: resourceDisposalFromJson(json['disposal']),
    hazardClasses: hazardClassesFromJson(json['hazardClasses']),
    attachments,
  });
}

export function outputMaterialParamsToJson(
  outputMaterial: OutputMaterialParams,
): { [k: string]: any } {
  return {
    containerId: outputMaterial.containerId,
    id: outputMaterial.id,
    name: outputMaterial.name,
    baseUnit: outputMaterial.baseUnit,
    numUnitsProduced: outputMaterial.numUnitsProduced,
    storage: resourceStorageParamsToJson(outputMaterial.storage),
    disposal: resourceDisposalParamsToJson(outputMaterial.disposal),
    hazardClasses: hazardClassesToJson(outputMaterial.hazardClasses),
  };
}
