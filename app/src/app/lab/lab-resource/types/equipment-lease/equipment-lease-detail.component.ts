import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';

import { EquipmentLease } from './equipment-lease';
import { Observable, of } from 'rxjs';
import {
  Equipment,
  EquipmentService,
} from 'src/app/equipment/equipment';
import { EquipmentProvision } from 'src/app/equipment/provision/equipment-provision';
import { EquipmentInfoComponent } from 'src/app/equipment/equipment-info.component';
import { LabEquipmentProvisionInfoComponent } from 'src/app/lab/lab-equipment/equipment-provision-info.component';

@Component({
  selector: 'lab-equipment-lease-detail',
  standalone: true,
  imports: [
    CommonModule,

    EquipmentInfoComponent,
    LabEquipmentProvisionInfoComponent
  ],
  template: `
    @if (equipment | async; as equipment) {
      <equipment-info [equipment]="equipment" />
    } @else if (equipmentProvision) {
      <lab-equipment-provision-info [provision]="equipmentProvision" />
    }
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
  get equipmentProvision(): EquipmentProvision | null {
    if (
      this.lease!.equipment instanceof Equipment ||
      typeof this.lease!.equipment === 'string'
    ) {
      return null;
    }
    return this.lease!.equipment;
  }
}
