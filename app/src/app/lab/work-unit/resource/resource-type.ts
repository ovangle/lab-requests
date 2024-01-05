import { Pipe, PipeTransform } from "@angular/core";

export const ALL_RESOURCE_TYPES = [
    'equipment',
    'software',
    'input-material',
    'output-material',
    'task',
] as const;

export type ResourceType = typeof ALL_RESOURCE_TYPES[ number ];

export function isResourceType(obj: any): obj is ResourceType {
    return typeof obj === 'string'
        && ALL_RESOURCE_TYPES.includes(obj as any);
}

export function resourceTypeFromJson(json: unknown) {
    if (!isResourceType(json)) {
        throw new Error(`Expected a resource type ${json}`)
    }
    return json;
}



