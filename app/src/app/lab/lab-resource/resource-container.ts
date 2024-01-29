import { Injectable } from '@angular/core';
import { Observable, defer, firstValueFrom, map, tap } from 'rxjs';
import { ALL_RESOURCE_TYPES, ResourceType } from './resource-type';

import type { Resource } from './resource';
import {
  Model,
  ModelParams,
  modelParamsFromJsonObject,
} from 'src/app/common/model/model';
import {
  EquipmentLease,
  equipmentLeaseFromJson,
  equipmentLeaseParamsToJson,
} from '../lab-resources/equipment-lease/equipment-lease';
import {
  InputMaterial,
  inputMaterialFromJson,
  InputMaterialParams,
  inputMaterialToJson,
} from '../lab-resources/input-material/input-material';
import {
  OutputMaterial,
  outputMaterialFromJson,
  OutputMaterialParams,
  outputMaterialParamsToJson,
} from '../lab-resources/output-material/output-material';
import { SoftwareLease, softwareLeaseFromJsonObject, softwareParamsToJson } from '../lab-resources/software-lease/software-lease';
import {
  Software,
  softwareFromJsonObject,
  SoftwareParams,
} from '../software/software';
import { ResearchPlan } from 'src/app/research/plan/research-plan';
import { JsonObject, isJsonObject } from 'src/app/utils/is-json-object';

export interface ResourceContainerParams extends ModelParams {
  equipments: readonly EquipmentLease[];
  softwares: readonly SoftwareLease[];

  inputMaterials: readonly InputMaterial[];
  outputMaterials: readonly OutputMaterial[];
}

export class ResourceContainer extends Model {
  equipments: readonly EquipmentLease[];
  softwares: readonly SoftwareLease[];

  inputMaterials: readonly InputMaterial[];
  outputMaterials: readonly OutputMaterial[];

  constructor(params: ResourceContainerParams) {
    super(params);
    this.equipments = params.equipments;
    this.softwares = params.softwares;
    this.inputMaterials = params.inputMaterials;
    this.outputMaterials = params.outputMaterials;
  }

  getResources<T extends Resource>(t: ResourceType & T[ 'type' ]): readonly T[] {
    return this[ resourceContainerAttr(t) ] as any[];
  }

  countResources(t: ResourceType): number {
    return this.getResources(t).length;
  }

  getResourceAt<T extends Resource>(
    t: ResourceType & T[ 'type' ],
    index: number,
  ): T {
    const resources = this.getResources(t);
    if (index < 0 || index >= resources.length) {
      throw new Error(`No resource at ${index}`);
    }
    return resources[ index ];
  }
}

export function resourceContainerAttr(
  type: ResourceType,
): keyof ResourceContainerPatch {
  switch (type) {
    case 'equipment-lease':
      return 'equipments';
    case 'software-lease':
      return 'softwares';
    case 'input-material':
      return 'inputMaterials';
    case 'output-material':
      return 'outputMaterials'
  }
}

export function resourceContainerParamsFromJson(json: JsonObject): ResourceContainerParams {
  const baseParams = modelParamsFromJsonObject(json);

  if (!Array.isArray(json[ 'equipments' ]) || !json[ 'equipments' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'equipments'")
  }
  const equipments = json[ 'equipments' ].map(equipmentLeaseFromJson);

  if (!Array.isArray(json[ 'softwares' ]) || !json[ 'softwares' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'softwares'")
  }
  const softwares = json[ 'softwares' ].map(softwareLeaseFromJsonObject);

  if (!Array.isArray(json[ 'inputMaterials' ]) || !json[ 'inputMaterials' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'inputMaterials'")
  }
  const inputMaterials = json[ 'inputMaterials' ].map(inputMaterialFromJson);

  if (!Array.isArray(json[ 'outputMaterials' ]) || !json[ 'outputMaterials' ].every(isJsonObject)) {
    throw new Error("Expected a list of json objects 'outputMaterials'")
  }
  const outputMaterials = json[ 'outputMaterials' ].map(outputMaterialFromJson);


  return {
    ...baseParams,
    equipments,
    softwares,

    inputMaterials,
    outputMaterials
  };
}

interface ResourceSplice<T> {
  readonly start: number;
  readonly end?: number;
  readonly items: T[];
}

export interface ResourceContainerPatch {
  equipments: ResourceSplice<EquipmentLease>[];
  softwares: ResourceSplice<SoftwareParams>[];
  inputMaterials: ResourceSplice<InputMaterialParams>[];
  outputMaterials: ResourceSplice<OutputMaterialParams>[];
}

export function resourceContainerPatchToJson(
  patch: ResourceContainerPatch,
): JsonObject {
  let json: JsonObject = {};
  for (const resourceType of ALL_RESOURCE_TYPES) {
    const resourceToJson = resourceSerializer(resourceType);

    const slices = patch[ resourceContainerAttr(resourceType) ];

    json[ resourceContainerAttr(resourceType) ] = slices.map((slice) => ({
      ...slice,
      items: slice.items.map((item) => resourceToJson(item as any)),
    }));
  }
  return json;

  function resourceSerializer(resourceType: ResourceType) {
    switch (resourceType) {
      case 'equipment-lease':
        return equipmentLeaseParamsToJson;
      case 'software-lease':
        return softwareParamsToJson;
      case 'input-material':
        return inputMaterialToJson;
      case 'output-material':
        return outputMaterialParamsToJson;
    }
  }
}

function delResourcePatch<T extends Resource>(
  resourceType: T[ 'type' ] & ResourceType,
  toDel: number[],
): Partial<ResourceContainerPatch> {
  return {
    [ resourceContainerAttr(resourceType) ]: toDel.map((toDel) => ({
      start: toDel,
      end: toDel + 1,
      items: [],
    })),
  };
}

@Injectable({ providedIn: 'root' })
export abstract class ResourceContainerContext {
  abstract commitContext(patch: Partial<ResourceContainerPatch>): Promise<ResourceContainer>;
  abstract committed$: Observable<ResourceContainer>;
  abstract getContainerRouterLink(): Promise<any[]>;

  committedResources$<TResource extends Resource>(
    resourceType: ResourceType,
  ): Observable<readonly TResource[]> {
    return this.committed$.pipe(
      map((committed) =>
        committed ? committed.getResources<TResource>(resourceType) : [],
      ),
    );
  }

  async getResourceAt<T extends Resource>(resourceType: T[ 'type' ], index: number): Promise<T | undefined> {
    const committed = await firstValueFrom(this.committed$);
    return committed.getResourceAt(resourceType, index);
  }

  async commit(patch: ResourceContainerPatch): Promise<ResourceContainer> {
    const committed = await firstValueFrom(this.committed$);
    if (!committed) {
      throw new Error('Cannot commit resources until container exists');
    }
    this.commitContext(patch);
    return firstValueFrom(this.committed$);
  }

  async deleteResourceAt(resourceType: ResourceType, index: number) {
    const committed = await firstValueFrom(this.committed$);
    if (committed == null) {
      throw new Error('Cannot delete resources until container');
    }
    const patch = delResourcePatch(resourceType, [ index ]);
    return this.commitContext(patch);
  }
}
