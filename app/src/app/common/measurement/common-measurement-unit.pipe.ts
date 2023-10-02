import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";


@Pipe({
    name: 'commonMeasurementUnit',
    standalone: true
})
export class CommonMeasurementUnitPipe implements PipeTransform {
    constructor(
        readonly sanitizer: DomSanitizer
    ) {}

    transform(value: any, ...args: any[]) {
        const html = value.replaceAll(/\^(\d+)/g, '<sup>$1</sup>');
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}