import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { Equipment, EquipmentService } from '../../../equipment/equipment';
import { HttpParams } from '@angular/common/http';
import { LabEquipmentListComponent } from '../lab-equipment-list.component';
import { LabProfilePage } from '../../_features/lab-profile.page';
import { Lab } from '../../lab';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'lab-equipment-index-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    LabEquipmentListComponent
  ],
  template: `
    @if (lab$ | async; as lab) {
      <h2>
        Equipment
        <div class="equipment-index-controls">
          <a mat-raised-button
             color="primary"
             routerLink="./request">
             Request
          </a>
        </div>
      </h2>
    } @else {
      <h1>All equipment</h1>
    }

    <lab-equipment-list />

    <ng-template #controls>
      <div class="equipment-list-controls">
        <a
          mat-raised-button
          class="create-button"
          color="primary"
          routerLink="./create"
        >
          + Add
        </a>
        <a
          mat-raised-button
          class="request-button"
          color="primary"
          routerLink="./provision/request"
        >
          + Request
        </a>
      </div>
    </ng-template>
  `,
  styles: [
    `
      div.equipment-list-controls {
        float: right;
      }
      a + a {
        margin-left: 1em;
      }
    `,
  ],
})
export class EquipmentIndexPage {
  readonly labProfile = inject(LabProfilePage, { optional: true })
  readonly equipments = inject(EquipmentService);

  readonly lab$: Observable<Lab | null> = this.labProfile ? this.labProfile.lab$ : of(null);

  readonly equipments$: Observable<Equipment[]> = this.lab$.pipe(
    switchMap(lab => {
      let params = new HttpParams();
      if (lab) {
        params = params.set('lab', lab.id);
      }
      return this.equipments.query(params);
    }),
    tap(equipments => {
      console.log('equipments', equipments)
    }),
    shareReplay(1)
  )
}
