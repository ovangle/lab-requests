import { Pipe, PipeTransform } from "@angular/core";

export const ALL_RESOURCE_TYPES = [
    'equipment',
    'software',
    'input-material',
    'output-material',
    'task',
] as const;

export type ResourceType = typeof ALL_RESOURCE_TYPES[number];

export function isResourceType(obj: any): obj is ResourceType {
    return typeof obj === 'string' 
        && ALL_RESOURCE_TYPES.includes(obj as any);
}

export type ResourceTypeFormatOption = 'titleCase' | 'plural';

@Pipe({name: 'resourceType', standalone: true})
export class ResourceTypePipe implements PipeTransform {

    transform(value: ResourceType, ...args: ResourceTypeFormatOption[]) {
        let fmtValue: string = value;
        if (args.includes('plural')) {
            fmtValue += 's';
        } 
        if (args.includes('titleCase')) {
            fmtValue    = fmtValue.substring(0, 1).toLocaleUpperCase()
                        + fmtValue.substring(1); 
        }
        return fmtValue.replace('-', ' ');
    }
}

