import { CommonModule } from '@angular/common';
import { Component, Injectable, Provider, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Connectable,
  Observable,
  Subscription,
  connectable,
  shareReplay,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  EquipmentCollection,
  EquipmentContext,
  EquipmentService,
  Equipment,
} from '../common/equipment';

function equipmentContextFromDetailRoute(): Observable<Equipment> {
  const route = inject(ActivatedRoute);
  const equipmentService = inject(EquipmentService);
  const equipments = inject(EquipmentCollection, { optional: true });

  return route.paramMap.pipe(
    takeUntilDestroyed(),
    switchMap((params) => {
      const equipmentId = params.get('equipment_id');
      if (!equipmentId) {
        throw new Error('No equipment in route');
      }
      return equipmentService.fetch(equipmentId);
    }),
  );
}

@Component({
  selector: 'lab-equipment-detail-page',
  template: `
    @if (context.equipment$ | async; as equipment) {
      <lab-equipment-info [equipment]="equipment"></lab-equipment-info>

      <h3>Description</h3>
      <p>{{ equipment.description }}</p>

      <lab-equipment-training-descriptions-info
        [trainingDescriptions]="equipment.trainingDescriptions"
      >
      </lab-equipment-training-descriptions-info>
    }
  `,
  providers: [EquipmentContext],
})
export class EquipmentDetailPage {
  readonly context = inject(EquipmentContext);

  constructor() {
    this.context.sendCommitted(equipmentContextFromDetailRoute());
  }
}
