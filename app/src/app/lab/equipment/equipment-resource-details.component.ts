import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { Equipment } from "./equipment";


@Component({
    selector: 'lab-req-equipment-resource-details',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `

    `
})
export class EquipmentResourceDetailsComponent {
    @Input()
    equipment: Equipment;
}