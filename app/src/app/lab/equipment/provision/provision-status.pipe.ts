import { Pipe, PipeTransform } from "@angular/core";
import { ProvisionStatus } from "./provision-status";

@Pipe({
    standalone: true,
    name: 'provisionStatus',
})
export class ProvisionStatusPipe implements PipeTransform {
    transform(value: ProvisionStatus, ...args: any[]): string {
        return value;
    }

}
