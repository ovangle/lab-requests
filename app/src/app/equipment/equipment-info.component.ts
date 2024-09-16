import { Component, inject, Input, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { EquipmentTagChipsComponent } from './tag/equipment-tag-chips.component';
import { MatButtonModule } from '@angular/material/button';
import { EquipmentTrainingDescriptionListComponent } from './training/training-description-list.component';
import { EquipmentTrainingAcknowlegementComponent } from './training/training-acknowlegment-input.component';
import { EquipmentTrainingDescriptionsInfoComponent } from './training/training-descriptions-info.component';
import { Equipment, EquipmentService } from './equipment';
import { ModelRef } from '../common/model/model';
import { toObservable } from '@angular/core/rxjs-interop';
import { of, shareReplay, switchMap } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

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
  @if (equipment$ | async; as equipment) {
      {{ equipment.name }}

      @if (!this.hideTags()) {
        <equipment-tag-chips [tags]="equipment.tags" />
      }
  }
  `,
  styles: [``],
})
export class EquipmentInfoComponent {
  _equipmentService = inject(EquipmentService);
  equipment = input.required<ModelRef<Equipment>>();
  hideTags = input(false, { transform: coerceBooleanProperty });

  readonly equipment$ = toObservable(this.equipment).pipe(
    switchMap(equipment => {
      if (equipment instanceof Equipment) {
        return of(equipment)
      }
      return this._equipmentService.fetch(equipment)
    }),
    shareReplay(1)
  )

}
