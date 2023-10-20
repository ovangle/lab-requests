import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { UnitOfMeasurement, formatUnitOfMeasurement } from "./measurement";


@Pipe({
    name: 'commonMeasurementUnit',
    standalone: true
})
export class CommonMeasurementUnitPipe implements PipeTransform {
    constructor(
        readonly sanitizer: DomSanitizer
    ) {}

    transform(value: UnitOfMeasurement, pluralQuantity: number = 1, ...args: any[]) { 
        return formatUnitOfMeasurement(value, pluralQuantity);
    }
}