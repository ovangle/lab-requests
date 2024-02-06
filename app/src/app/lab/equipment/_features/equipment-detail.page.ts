import { validate as validateIsUUID } from 'uuid';
import { CommonModule } from '@angular/common';
import { Component, Injectable, Provider, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Observable,
  combineLatest,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Equipment,
  EquipmentInstallation,
  injectEquipmentService,
} from '../equipment';
import { EquipmentInfoComponent } from '../equipment-info.component';
import { EquipmentTrainingDescriptionsInfoComponent } from '../training/training-descriptions-info.component';
import { LabEquipmentPageHeaderComponent } from '../equipment-page-header.component';
import { injectMaybeLabFromContext } from '../../lab-context';

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
      if (!validateIsUUID(equipmentId)) {
        throw new Error('equipment_id must be a uuid')
      }
      return equipments.fetch(equipmentId);
    }),
    shareReplay(1)
  );
}

@Component({
  selector: 'lab-equipment-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    LabEquipmentPageHeaderComponent,
    EquipmentInfoComponent,
    EquipmentTrainingDescriptionsInfoComponent
  ],
  template: `
    Equipment detail
    @if (equipment$ | async; as equipment) {
      <lab-equipment-page-header [equipment]="equipment" />

      <h3>Description</h3>
      <p>{{ equipment.description }}</p>

      <lab-equipment-training-descriptions-info
        [trainingDescriptions]="equipment.trainingDescriptions"
      >
      </lab-equipment-training-descriptions-info>

      <div class="installation-info">
        @if (installations$ | async; as installations) {
          Installed: {{_numInstalled(installations)}}
          Provisioned: {{_numProvisioned(installations)}}

        } @else {
          <p>No existing installations<p>          
        }
      </div>
    }
  `,
})
export class EquipmentDetailPage {
  readonly equipment$ = equipmentFromDetailRoute();
  readonly lab$ = injectMaybeLabFromContext();

  readonly installations$: Observable<EquipmentInstallation[]> = combineLatest([ this.lab$, this.equipment$ ]).pipe(
    map(([ lab, equipment ]) => {
      let installations = equipment.installations;
      if (lab) {
        installations = installations.filter(install => install.labId == lab.id);
      }
      return installations
    })
  );

  _numInstalled(installations: EquipmentInstallation[]) {
    return installations.filter(i => i.provisionStatus === 'installed')[ 0 ]?.numInstalled || 0;
  }
  _numProvisioned(installations: EquipmentInstallation[]) {
    return installations.filter(i => [ 'requested', 'approved' ].includes(i.provisionStatus))[ 0 ]?.numInstalled || 0;
  }
}
