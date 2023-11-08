import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, LOCALE_ID, Pipe, PipeTransform, inject } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { UnitOfMeasurement, formatUnitOfMeasurement } from "./measurement";


@Pipe({
    name: 'commonMeasurementUnit',
    standalone: true
})
export class MeasurementUnitPipe implements PipeTransform {
    readonly sanitizer = inject(DomSanitizer);
    readonly locale: string = inject(LOCALE_ID);

    transform(value: UnitOfMeasurement, pluralQuantity: number = 1, ...args: any[]) { 
        return formatUnitOfMeasurement(value, pluralQuantity, this.locale);
    }
}
