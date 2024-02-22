import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatListModule } from '@angular/material/list';
import { EquipmentTagChipsComponent } from '../../equipment/tag/equipment-tag-chips.component';
import { RouterModule } from '@angular/router';
import { Equipment, EquipmentService } from '../../equipment/equipment';
import { Lab } from '../lab';
import { LabEquipmentService } from './lab-equipment.service';
import { HttpParams } from '@angular/common/http';
import { ModelSearchControl } from 'src/app/common/model/search/search-control';
import { LabContext } from '../lab-context';
import { Observable, combineLatest, first, firstValueFrom, map, of, switchMap } from 'rxjs';
import { EquipmentInstallation } from 'src/app/equipment/installation/equipment-installation';

@Component({
  selector: 'lab-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,

    MatListModule,
    MatTableModule,

    EquipmentTagChipsComponent,
  ],
  template: `
    <mat-list>
      @if (equipments$ | async; as equipments) {
        @for (equipment of equipments; track equipment.id) {
          <ng-container *ngTemplateOutlet="equipmentItem; context: (equipmentItemContext(equipment) | async)" />
        }
      }
    </mat-list>

    <ng-template #equipmentItem let-equipment let-numInstalled="numInstalled" let-numPending="numPending">
      <a mat-list-item [routerLink]="['/equipments', equipment.id]" >
        <span matListItemTitle>{{ equipment.name }}</span>
        <span matListItemLine>
          <span class="num-installed">
            <span class="item-label">Installed</span>
            <span class="item-count">{{numInstalled}}</span>
          </span>
          <span class="num-pending">
            <span class="item-label">Pending</span>
            <span class="item-count">{{numPending}}</span>
          </span>
        </span>
        <span matListItemMeta>
          <equipment-tag-chips [equipment]="equipment" />
        </span>
      </a>
    </ng-template>
  `,
  styles: [
    `
      span.mat-mdc-list-item-meta {
        display: flex !important;
        flex-basis: 60%;
        justify-content: flex-end;
      }
    `,
  ],
  providers: [
    LabEquipmentService
  ]
})
export class LabEquipmentListComponent {

  labContext = inject(LabContext);
  readonly lab$ = this.labContext.committed$;

  _equipments = inject(EquipmentService);
  _labEquipments = inject(LabEquipmentService);

  equipmentSearch = new ModelSearchControl<EquipmentInstallation>(
    (search: string) => this.getEquipments(search),
    (equipment: EquipmentInstallation) => equipment.equipmentName
  );

  getEquipments(search: string): Observable<EquipmentInstallation[]> {
    return this._labEquipments.query({ search });
  }

  readonly equipments$ = this.equipmentSearch.modelOptions$;

  async equipmentItemContext(install: EquipmentInstallation): Promise<{ $implicit: Equipment, numInstalled: number, numPending: number }> {
    const lab = await firstValueFrom(this.lab$);
    const equipment = await install.resolveEquipment(this._equipments);
    const labInstalls = equipment.installations.filter(install => install.labId === lab.id);

    const numInstalled = labInstalls.filter(i => i.isInstalled)
      .reduce((acc, install) => acc + install.numInstalled, 0);
    const numPending = labInstalls.filter(i => i.isPendingInstallation)
      .reduce((acc, install) => acc + install.numInstalled, 0);

    return { $implicit: equipment, numInstalled, numPending }
  }
}
