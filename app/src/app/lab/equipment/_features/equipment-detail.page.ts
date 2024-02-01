import { CommonModule } from '@angular/common';
import { Component, Injectable, Provider, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Observable,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EquipmentContext,
  Equipment,
  injectEquipmentService,
} from '../equipment';
import { EquipmentInfoComponent } from '../equipment-info.component';
import { EquipmentTrainingDescriptionsInfoComponent } from '../training/training-descriptions-info.component';

function equipmentFromDetailRoute(): Observable<Equipment> {
  const route = inject(ActivatedRoute);
  const equipments = injectEquipmentService();

  return route.paramMap.pipe(
    takeUntilDestroyed(),
    switchMap((params) => {
      const equipmentId = params.get('equipment_id');
      console.log('equipment id', equipmentId);
      if (!equipmentId) {
        throw new Error('No equipment in route');
      }
      return equipments.fetch(equipmentId);
    }),
  );
}

@Component({
  selector: 'lab-equipment-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    EquipmentInfoComponent,
    EquipmentTrainingDescriptionsInfoComponent
  ],
  template: `
    Equipment detail
    @if (equipment$ | async; as equipment) {
      <lab-equipment-info [equipment]="equipment"></lab-equipment-info>

      <h3>Description</h3>
      <p>{{ equipment.description }}</p>

      <lab-equipment-training-descriptions-info
        [trainingDescriptions]="equipment.trainingDescriptions"
      >
      </lab-equipment-training-descriptions-info>
    }
  `,
  providers: [ EquipmentContext ],
})
export class EquipmentDetailPage {
  readonly equipment$ = equipmentFromDetailRoute();

}
