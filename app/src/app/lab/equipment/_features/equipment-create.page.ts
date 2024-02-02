import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Subscription, firstValueFrom, of } from 'rxjs';
import { EquipmentForm, equipmentForm } from '../equipment-form.service';
import { Router } from '@angular/router';
import {
  Equipment,
  EquipmentCollection,
  EquipmentPatch,
  EquipmentService,
} from '../equipment';
import { LabEquipmentFormComponent } from '../equipment-form.component';


@Component({
  selector: 'lab-equipment-create-page',
  standalone: true,
  imports: [
    LabEquipmentFormComponent
  ],
  template: `
    <h1>Create equipment</h1>

    <lab-equipment-form
      [form]="form"
      [committed]="null"
      (requestCommit)="createEquipment($event)"
    />
  `,
})
export class EquipmentCreatePage {
  readonly _cdRef = inject(ChangeDetectorRef);
  readonly _router = inject(Router);

  readonly equipmentService = inject(EquipmentService);
  readonly form = equipmentForm();

  async createEquipment(patch: EquipmentPatch) {
    const equipment = await firstValueFrom(this.equipmentService.create(patch));
    await this._router.navigate([ 'lab', 'equipments', equipment.id ]);
  }
}
