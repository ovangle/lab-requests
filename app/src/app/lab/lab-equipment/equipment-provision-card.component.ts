import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { EquipmentProvision } from "../../equipment/provision/equipment-provision";
import { MatCardModule } from "@angular/material/card";
import { Equipment, EquipmentService } from "src/app/equipment/equipment";

@Component({
    selector: 'lab-equipment-provision-info',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule
    ],
    template: `
    @if (provision!.resolveEquipment(equipmentService) | async; as equipment) {
        <mat-card>
            <mat-card-header>
                {{equipment.name}}
            </mat-card-header>
            <mat-card-content>

            </mat-card-content>
        </mat-card>
    }
    `
})
export class LabEquipmentProvisionInfoComponent {
    readonly equipmentService = inject(EquipmentService);

    @Input({ required: true })
    provision: EquipmentProvision | undefined;

}