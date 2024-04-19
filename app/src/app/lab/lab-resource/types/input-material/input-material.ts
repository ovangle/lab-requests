import { Injectable } from '@angular/core';
import {
  HazardClass,
  hazardClassesFromJson,
  hazardClassesToJson,
} from '../../hazardous/hazardous';
import { ResourceParams, Resource, resourceParamsFromJsonObject, ResourcePatch, ResourceService } from '../../resource';
import {
  ResourceStorage,
  ResourceStorageParams,
  resourceStorageFromJson,
  resourceStorageParamsToJson,
} from '../../storage/resource-storage';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';
import { HttpParams } from '@angular/common/http';
import { ModelQuery } from 'src/app/common/model/model';

export interface InputMaterialParams extends ResourceParams {
  name: string;
  description: string;
  baseUnit: string;

  numUnitsRequired: number;
  perUnitCostEstimate: number | null;

  storage: ResourceStorage | ResourceStorageParams;
  hazardClasses?: HazardClass[];
}

export class InputMaterial extends Resource {
  override readonly type = 'input_material';

  name: string;
  description: string;
  baseUnit: string;

  numUnitsRequired: number;

  perUnitCostEstimate: number | null;

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
  if (typeof json[ 'perUnitCostEstimate' ] !== 'number') {
    throw new Error("Expected a json object or null 'perUnitCostEstimate'");
  }

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
    perUnitCostEstimate: json[ 'perUnitCostEstimate' ],
    storage,
    hazardClasses,
  });
}

export interface InputMaterialPatch extends ResourcePatch<InputMaterial> {

}

export function inputMaterialPatchToJsonObject(inputMaterial: InputMaterial | null, patch: Partial<InputMaterialPatch>): JsonObject {
  return {
    id: inputMaterial!.id,
    index: inputMaterial!.index,
    name: inputMaterial!.name,
    baseUnit: inputMaterial!.baseUnit,
    numUnitsRequired: inputMaterial!.numUnitsRequired,
    perUnitCostEstimate: inputMaterial!.perUnitCostEstimate,
    storage: resourceStorageParamsToJson(inputMaterial!.storage),
    hazardClasses: hazardClassesToJson(inputMaterial!.hazardClasses),
  };
}

@Injectable()
export class InputMaterialService extends ResourceService<InputMaterial, InputMaterialPatch> {
  override readonly resourceType = 'input_material';

  override resourcePatchToJson(current: InputMaterial | null, params: Partial<InputMaterialPatch>): JsonObject {
    return inputMaterialPatchToJsonObject(current, params);
  }
  override modelFromJsonObject(json: JsonObject): InputMaterial {
    return inputMaterialFromJson(json);
  }
  override modelQueryToHttpParams(lookup: ModelQuery<InputMaterial>): HttpParams {
    throw new Error('Method not implemented.');
  }

}