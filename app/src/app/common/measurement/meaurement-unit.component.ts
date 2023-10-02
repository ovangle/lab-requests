import { CommonModule } from "@angular/common";
import { Component, HostBinding, Input, inject } from "@angular/core";
import { CommonMeasurementUnitPipe } from "./common-measurement-unit.pipe";


@Component({
    selector: 'common-measurement-unit',
    standalone: true,
    imports: [
        CommonModule,
        CommonMeasurementUnitPipe
    ],
    template: `
    `
})
export class CommonMeasurementUnitComponent {
    @Input()
    unit: string;

    readonly _measure = inject(CommonMeasurementUnitPipe);

    @HostBinding('attr.innerHTML')
    get hostInnerHtml() {
        return this._measure.transform(this.unit);
    }
}