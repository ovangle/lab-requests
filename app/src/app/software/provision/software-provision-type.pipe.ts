import { Pipe, PipeTransform } from "@angular/core";
import { SoftwareProvisionType } from "./software-provision";


@Pipe({
    name: 'softwareProvisionType',
    standalone: true,
})
export class SoftwareProvisionTypePipe implements PipeTransform {

    transform(value: SoftwareProvisionType, ...args: any[]) {
        switch (value) {
            case 'new_software':
                return 'New Software'
            case 'upgrade_software':
                return 'Upgrade software version'
            default:
                throw new Error(`Unrecognised software provision type ${value}`);
        }
    }
}