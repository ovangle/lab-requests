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
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ],
  template: `
  <div class="equipment-index-header">
    <h2>
      Equipment
      
    </h2>
    <div class="equipment-index-controls">
      <a mat-raised-button
         color="primary"
         routerLink="./create">
        <mat-icon>add</mat-icon>Add
      </a>
    </div>
  </div>

    <mat-list>
      @if (equipments$ | async; as equipments) {
        @for (equipment of equipments; track equipment.id) {
          <a mat-list-item [routerLink]="['./', equipment.id]">
            {{equipment.name}}
          </a>
        }
      }
    </mat-list>
  `,
  styles: [
    `
    :host {
      display: block;
      margin-top: 1em;
      margin-left: 2em;
      max-width: 80%;
    }
    .equipment-index-header {
      display: flex;
      justify-content: space-between;
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
