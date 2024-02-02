import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';

import { EquipmentInfoComponent } from 'src/app/lab/equipment/equipment-info.component';
import { EquipmentLease } from './equipment-lease';
import { Observable, of } from 'rxjs';
import {
  Equipment,
  EquipmentService,
} from 'src/app/lab/equipment/equipment';
import { LabEquipmentProvisionInfoComponent } from '../../equipment/provision/equipment-provision-info.component';
import { LabEquipmentProvision } from '../../equipment/provision/lab-equipment-provision';

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
      <lab-equipment-info [equipment]="equipment" />
    } @else if (equipmentProvision) {
      <lab-equipment-provision-info [equipmentProvision]="equipmentProvision" />
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
  get equipmentProvision(): LabEquipmentProvision | null {
    if (
      this.lease!.equipment instanceof Equipment ||
      typeof this.lease!.equipment === 'string'
    ) {
      return null;
    }
    return this.lease!.equipment;
  }
}
