import { Component, Input } from "@angular/core";
import { HazardClass, hazardClassLabelImage } from "./hazardous";

@Component({
    selector: 'lab-req-hazard-classes-details',
    template: `
    `,
})
export class HazardClassesDetailsComponent {
    @Input()
    hazardClasses: HazardClass[];

    readonly labelImage = hazardClassLabelImage;
}