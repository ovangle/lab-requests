import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';

import { EquipmentInfoComponent } from 'src/app/lab/equipment/equipment-info.component';
import { EquipmentLease } from './equipment-lease';
import { Observable, of } from 'rxjs';
import {
  Equipment,
  EquipmentService,
} from 'src/app/lab/equipment/equipment';
import { EquipmentRequest } from 'src/app/lab/equipment/request/equipment-request';
import { EquipmentRequestInfoComponent } from 'src/app/lab/equipment/request/equipment-request-info.component';

@Component({
  selector: 'lab-equipment-lease-detail',
  standalone: true,
  imports: [
    CommonModule,

    EquipmentInfoComponent,
    EquipmentRequestInfoComponent,
  ],
  template: `
    <div class="equipment-or-equipment-request">
      @if (equipment | async; as equipment) {
        <lab-equipment-info [equipment]="equipment" />
      } @else if (equipmentRequest) {
        <lab-equipment-request-info [equipment]="equipmentRequest" />
      }
    </div>
  `,
})
export class EquipmentLeaseDetailComponent {
  equipments = inject(EquipmentService);

  @Input({ required: true })
  lease: EquipmentLease | undefined = undefined;

  get equipment(): Observable<Equipment | null> {
    const rawEquipment = this.lease!.equipment;
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
      this.lease!.equipment instanceof Equipment ||
      typeof this.lease!.equipment === 'string'
    ) {
      return null;
    }
    return this.lease!.equipment;
  }
}
