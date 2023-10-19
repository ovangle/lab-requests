import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import * as pluralize from 'pluralize';


@Pipe({
    name: 'commonMeasurementUnit',
    standalone: true
})
export class CommonMeasurementUnitPipe implements PipeTransform {
    constructor(
        readonly sanitizer: DomSanitizer
    ) {}

    transform(value: any, ...args: any[]) {
        if (args.length > 0) {
            const pluralQuantity = +args[0];
            value = pluralize(value, pluralQuantity);
        }

        const html = value.replaceAll(/\^(\d+)/g, '<sup>$1</sup>');
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}