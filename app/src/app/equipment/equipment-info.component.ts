import { Component, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EquipmentTagChipsComponent } from './tag/equipment-tag-chips.component';
import { MatButtonModule } from '@angular/material/button';
import { EquipmentTrainingDescriptionListComponent } from './training/training-description-list.component';
import { EquipmentTrainingAcknowlegementComponent } from './training/training-acknowlegment-input.component';
import { EquipmentTrainingDescriptionsInfoComponent } from './training/training-descriptions-info.component';
import { Equipment } from './equipment';

export type EquipmentInfoDisplay
  = 'list-item'
  | 'name-only';

@Component({
  selector: 'equipment-info',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatButtonModule,

    EquipmentTrainingDescriptionsInfoComponent,
    EquipmentTagChipsComponent,
  ],
  template: `
    <h1>
      {{ equipment().name }}
      <equipment-tag-chips [equipment]="equipment()">
      </equipment-tag-chips>
    </h1>
  `,
  styles: [``],
})
export class EquipmentInfoComponent {
  equipment = input.required<Equipment>();
  display = input<EquipmentInfoDisplay>('list-item');

}
