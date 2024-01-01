import { Injectable, forwardRef, inject } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import {
  SidenavMenuGroupControl,
  SidenavMenuLink,
} from 'src/app/scaffold/sidenav-menu/sidenav-menu-group-control';
import { Equipment } from '../equipment/common/equipment';

@Injectable({ providedIn: 'root' })
export class LabSidenavMenuGroupControl extends SidenavMenuGroupControl {
  readonly equipment = new SidenavMenuGroupControl('equipment', 'Equipment');
  readonly plans = new SidenavMenuGroupControl('plans', 'Plans');

  constructor() {
    super('lab', 'Lab');

    this.equipment.value$.subscribe((equipmentGroup) => {
      console.log('equipment group', equipmentGroup);
    });

    const equipmentConnection = this.connectSubgroup(this.equipment);
    const planConnection = this.connectSubgroup(this.plans);
  }

  pushEquipmentLink(equipment: Equipment) {
    this.equipment.pushLink(
      new SidenavMenuLink(equipment.name, ['lab', 'equipments', equipment.id])
    );
  }
  removeEquipmentLink() {
    this.equipment.spliceLinks(0, 1);
  }
}
