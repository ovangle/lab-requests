import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import {
  ResourceDisposal,
  ResourceDisposalParams,
  resourceDisposalFromJson,
  resourceDisposalParamsToJson,
} from '../../disposal/resource-disposal';
import {
  HazardClass,
  hazardClassesFromJson,
  hazardClassesToJson,
} from '../../hazardous/hazardous';
import { ResourceParams, Resource, resourceParamsFromJsonObject, ResourcePatch, ResourceService, resourcePatchToJsonObject } from '../../resource';
import {
  ResourceStorage,
  ResourceStorageParams,
  resourceStorageFromJson,
  resourceStorageParamsToJson,
} from '../../storage/resource-storage';
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ModelQuery } from 'src/app/common/model/model';

export interface OutputMaterialParams extends ResourceParams {
  name: string;
  baseUnit: string;
  numUnitsProduced: number;
  disposal: ResourceDisposal | ResourceDisposalParams;
  storage: ResourceStorage | ResourceStorageParams;
  hazardClasses: HazardClass[];
}

export class OutputMaterial extends Resource {
  override readonly type = 'output_material';

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

export interface OutputMaterialPatch extends ResourcePatch {

}

export function outputMaterialPatchToJsonObject(
  outputMaterial: OutputMaterial | null, patch: OutputMaterialPatch
): JsonObject {
  return {
    ...resourcePatchToJsonObject(patch),
    name: outputMaterial?.name,
    baseUnit: outputMaterial?.baseUnit,
    numUnitsProduced: outputMaterial?.numUnitsProduced,
    storage: resourceStorageParamsToJson(outputMaterial!.storage),
    disposal: resourceDisposalParamsToJson(outputMaterial!.disposal),
    hazardClasses: hazardClassesToJson(outputMaterial!.hazardClasses),
  };
}

@Injectable()
export class OutputMaterialService extends ResourceService<OutputMaterial, OutputMaterialPatch> {
  override readonly resourceType = 'output_material';
  override patchToJsonObject(current: OutputMaterial | null, patch: OutputMaterialPatch): JsonObject {
    return outputMaterialPatchToJsonObject(current, patch);
  }
  override modelFromJsonObject(json: JsonObject): OutputMaterial {
    return outputMaterialFromJson(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<OutputMaterial>): HttpParams {
    throw new Error('Method not implemented.');
  }

}
