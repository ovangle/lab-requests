import { Component, Injectable, inject } from '@angular/core';
import { OutputMaterial, OutputMaterialService } from './output-material';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import {
  ResourceTableComponent,
} from '../../common/resource-table.component';
import { LabResourceContainerContext } from 'src/app/lab/lab-resource-consumer/resource-container';


@Component({
  selector: 'lab-output-material-table',
  standalone: true,
  imports: [ CommonModule, MatTableModule, ResourceTableComponent ],
  template: `
    <lab-resource-table
      resourceType="output-material"
      [displayedColumns]="['name']"
      [detailTemplate]="detailTemplate"
    >
      <tr matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">
          {{ element.name }}
        </td>
      </tr>
    </lab-resource-table>

    <ng-template #detailTemplate> </ng-template>
  `,
})
export class OutputMaterialTableComponent {
}
