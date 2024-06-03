import { Pipe, PipeTransform } from "@angular/core";
import { ProvisionType } from "src/app/lab/common/provisionable/provision-type";

@Pipe({
    name: 'equipmentProvisionType',
    standalone: true
})
export class EquipmentProvisionTypePipe implements PipeTransform {
    transform(value: ProvisionType, ...args: any[]) {
        switch (value) {
            case 'new_software':
                return 'New software';
            default:
                return `Unrecognised provision type (${value})`;
        }
    }

}