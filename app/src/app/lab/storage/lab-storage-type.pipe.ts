import { Pipe, PipeTransform } from "@angular/core";
import { StorageType, formatStorageType, StorageTypeFormatOptions } from "./lab-storage-type";


@Pipe({
    name: 'labStorageType',
    standalone: true
})
export class StorageTypePipe implements PipeTransform {
    transform(value: StorageType, options: StorageTypeFormatOptions = {}) {
        return formatStorageType(value, options);
    }
}