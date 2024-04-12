import { Component, Injectable, inject } from '@angular/core';
import { InputMaterial, InputMaterialService } from './input-material';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MeasurementUnitPipe } from 'src/app/common/measurement/common-measurement-unit.pipe';
import {
  ResourceTableDataSource,
  ResourceTableComponent,
} from '../../common/resource-table.component';
import { HazardClassLabelsComponent } from '../../hazardous/hazard-classes-labels.component';
import { ResourceStorageDetailsComponent } from '../../storage/resource-storage-details.component';

@Injectable()
export class InputMaterialTableDataSource extends ResourceTableDataSource<InputMaterial> {
  override readonly resourceType = 'input-material';
  override readonly resourceTitle = 'Input material';
  override readonly resourceService = inject(InputMaterialService);
}

@Component({
  selector: 'lab-input-material-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,

    ResourceTableComponent,

    MeasurementUnitPipe,
    ResourceStorageDetailsComponent,
    HazardClassLabelsComponent,
  ],
  template: `
    <lab-resource-table
      [displayedColumns]="['name', 'numUnitsRequired', 'storage', 'hazards']"
      [detailTemplate]="detailTemplate"
    >
      <tr matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">
          {{ element.name }}
        </td>
      </tr>

      <tr matColumnDef="numUnitsRequired">
        <th mat-header-cell *matHeaderCellDef>Amount required</th>
        <td mat-cell *matCellDef="let element">
          {{ element.numUnitsRequired }}
          <span [innerHTML]="element.baseUnit | commonMeasurementUnit"></span>
        </td>
      </tr>

      <tr matColumnDef="storage">
        <th mat-header-cell *matHeaderCellDef>Storage required</th>
        <td mat-cell *matCellDef="let element">
          {{ element.storage?.type || 'none/generic' }}
        </td>
      </tr>

      <tr matColumnDef="hazards">
        <th mat-header-cell *matHeaderCellDef>Hazard classes</th>
        <td mat-cell *matCellDef="let element">
          <lab-hazard-class-labels [hazardClasses]="element.hazardClasses">
          </lab-hazard-class-labels>
        </td>
      </tr>
    </lab-resource-table>

    <ng-template #detailTemplate let-element>
      <lab-resource-storage [storage]="element.storage"> </lab-resource-storage>
    </ng-template>
  `,
  providers: [
    InputMaterialService,
    {
      provide: ResourceTableDataSource,
      useClass: InputMaterialTableDataSource,
    },
  ],
})
export class InputMaterialTableComponent { }
