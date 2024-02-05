import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
    name: 'labProvisionStatus',
})
export class ProvisionStatusPipe implements PipeTransform {
    transform(value: any, ...args: any[]) {
        return value;
    }

}
