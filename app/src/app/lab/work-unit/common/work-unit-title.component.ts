import { Component, Input } from "@angular/core";
import { WorkUnit } from "./work-unit";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'lab-work-unit-title',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``
})
export class WorkUnitTitle {
    @Input({required: true})
    workUnit: WorkUnit;

}