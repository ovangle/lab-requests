import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { LabEquipmentProvision } from "../../../equipment/provision/equipment-provision";
import { MatCardModule } from "@angular/material/card";
import { Equipment } from "src/app/equipment/equipment";

@Component({
    selector: 'lab-equipment-provision-info',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule
    ],
    template: `
    <mat-card>
        <mat-card-header>
            {{provision!.equipment.name}}
        </mat-card-header>
        <mat-card-content>

        </mat-card-content>
    </mat-card>
    `
})
export class LabEquipmentProvisionInfoComponent {
    @Input({ required: true })
    provision: LabEquipmentProvision | undefined;
}