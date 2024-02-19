import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { Equipment, EquipmentService } from '../equipment';
import { HttpParams } from '@angular/common/http';
import { Lab } from '../../lab/lab';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { LabContext } from 'src/app/lab/lab-context';
import { MatListModule } from '@angular/material/list';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatListModule
  ],
  template: `
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

    <mat-list>
      @if (equipments$ | async; as equipments) {
        @for (equipment of equipments; track equipment.id) {
          <a mat-list-item [routerLink]="['./', equipment.id]">
            {{equipment.name}}
          </a>
        }
      }
    </mat-list>

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
  readonly labContext = inject(LabContext, { optional: true })
  readonly lab$: Observable<Lab | null> = this.labContext ? this.labContext.committed$ : of(null);

  readonly equipments = inject(EquipmentService);

  readonly equipments$: Observable<Equipment[]> = this.lab$.pipe(
    switchMap((lab) => {
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
