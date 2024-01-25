import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BehaviorSubject, defer, map, shareReplay, switchMap } from 'rxjs';
import { EquipmentCollection } from '../common/equipment';
import { HttpParams } from '@angular/common/http';
import { LabEquipmentListComponent } from '../equipment-list.component';

@Component({
  selector: 'lab-equipment-index-page',
  standalone: true,
  imports: [
    CommonModule,
    LabEquipmentListComponent
  ],
  template: `
    <h1>
      Lab Equipment
      <a
        mat-raised-button
        class="create-button"
        color="primary"
        routerLink="./create"
      >
        + Create
      </a>
    </h1>

    @if (equipments$ | async; as equipments) {
      <lab-equipment-list [equipments]="equipments"> </lab-equipment-list>
    }
  `,
  styles: [
    `
      a.create-button {
        float: right;
      }
    `,
  ],
  providers: [ EquipmentCollection ],
})
export class EquipmentIndexPage {
  readonly equipmentCollection = inject(EquipmentCollection);

  readonly query = new BehaviorSubject<{ [ k: string ]: any[] }>({});
  readonly page$ = this.query.pipe(
    switchMap((params) =>
      this.equipmentCollection.queryPage(
        new HttpParams({ fromObject: params }),
      ),
    ),
    shareReplay(1),
  );
  readonly equipments$ = defer(() => this.page$.pipe(map((p) => p.items)));
}
