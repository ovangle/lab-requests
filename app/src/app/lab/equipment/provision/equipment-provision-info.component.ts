import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { LabEquipmentProvision } from "./lab-equipment-provision";

@Component({
    selector: 'lab-equipment-provision-info',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    `
})
export class LabEquipmentProvisionInfoComponent {
    @Input({ required: true })
    provision: LabEquipmentProvision | undefined;
}