import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";

import { EquipmentInfoComponent } from "src/app/lab/equipment/equipment-info.component";
import { EquipmentLease } from "./equipment-lease";
import { Equipment, EquipmentModelService, EquipmentRequest } from "src/app/lab/equipment/equipment";
import { EquipmentRequestInfoComponent } from "src/app/lab/equipment/equipment-request-info.component";
import { Observable, of } from "rxjs";


@Component({
    selector: 'lab-equipment-lease-detail',
    standalone: true,
    imports: [
        CommonModule,

        EquipmentInfoComponent,
        EquipmentRequestInfoComponent
    ],
    template: `
    <div class="equipment-or-equipment-request">
        <ng-container *ngIf="equipment | async as equipment">
            <lab-equipment-info [equipment]="equipment" />
        </ng-container>
        <ng-container *ngIf="equipmentRequest">
            <lab-equipment-request-info [equipment]="equipmentRequest" />
        </ng-container>
    </div>
    `
})
export class EquipmentLeaseDetailComponent {
    equipments = inject(EquipmentModelService);

    @Input({required: true}) 
    lease: EquipmentLease;

    get equipment(): Observable<Equipment | null> {
        const rawEquipment = this.lease.equipment;
        if (typeof rawEquipment === 'string') {
            return this.equipments.fetch(rawEquipment);
        } else if (rawEquipment instanceof Equipment) {
            return of(rawEquipment);
        } else {
            return of(null);
        }
    }
    get equipmentRequest(): EquipmentRequest | null {
        if (
            this.lease.equipment instanceof Equipment
            || typeof this.lease.equipment === 'string'
        ) {
            return null;
        }
        return this.lease.equipment;
    }
    

}
