import { Component, computed, input } from "@angular/core";
import { UnitOfMeasurement } from "./measurement";
import { MeasurementUnitPipe } from "./common-measurement-unit.pipe";
import { CommonModule, DecimalPipe } from "@angular/common";


@Component({
    selector: 'common-quantity',
    standalone: true,
    imports: [
        DecimalPipe,
        MeasurementUnitPipe
    ],
    template: `
    {{amount() | number: decimalFormat() }} <span [innerHTML]="unit() | commonMeasurementUnit"></span> 
    `

})
export class CommonQuantityComponent {
    quantity = input.required<[number, UnitOfMeasurement]>();

    /** 
     * See the documentation for [DecimalPipe].
     * 
     * Essentially just,
     *  {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}
     */
    decimalFormat = input<string>('1.0-0');

    amount = computed(() => this.quantity()[0]);
    unit = computed(() => this.quantity()[1]);
}
