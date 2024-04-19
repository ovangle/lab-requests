import { Pipe, PipeTransform } from '@angular/core';

const _ALL_RESOURCE_TYPES = [
  'equipment_lease',
  'software_lease',
  'input_material',
  'output_material',
] as const;

export type ResourceType = (typeof _ALL_RESOURCE_TYPES)[ number ];

export function isResourceType(obj: any): obj is ResourceType {
  return typeof obj === 'string' && _ALL_RESOURCE_TYPES.includes(obj as any);
}

export const ALL_RESOURCE_TYPES: ReadonlyArray<ResourceType> = _ALL_RESOURCE_TYPES;

export function resourceTypeFromJson(json: unknown) {
  if (!isResourceType(json)) {
    throw new Error(`Expected a resource type ${json}`);
  }
  return json;
}
