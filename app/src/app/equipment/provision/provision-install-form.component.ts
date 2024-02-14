import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { LabEquipmentProvision } from "./equipment-provision";

@Component({
    selector: 'equipment-provision-install-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule

    ],
    template: ``
})
export class EquipmentProvisionInstallForm {
    @Input({ required: true })
    provision: LabEquipmentProvision | undefined;
}