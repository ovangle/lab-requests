import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, inject } from "@angular/core";
import { MeasurementUnitPipe } from "./common-measurement-unit.pipe";


@Component({
    selector: 'common-measurement-unit',
    standalone: true,
    imports: [
        CommonModule,
        MeasurementUnitPipe
    ],
    template: `
    `
})
export class CommonMeasurementUnitComponent {
    @Input()
    unit: string;

    readonly _measure = inject(MeasurementUnitPipe);

    @HostBinding('attr.innerHTML')
    get hostInnerHtml() {
        return this._measure.transform(this.unit);
    }
}