import { Pipe, PipeTransform } from '@angular/core';
import { ResourceType } from './resource-type';

export type ResourceTypeFormatOption = 'titleCase' | 'plural';

@Pipe({ name: 'resourceType', standalone: true })
export class ResourceTypePipe implements PipeTransform {
  transform(value: ResourceType, ...args: ResourceTypeFormatOption[]) {
    let fmtValue: string = value;
    if (args.includes('plural')) {
      fmtValue += 's';
    }
    if (args.includes('titleCase')) {
      fmtValue =
        fmtValue.substring(0, 1).toLocaleUpperCase() + fmtValue.substring(1);
    }
    return fmtValue.replace('-', ' ');
  }
}
