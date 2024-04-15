import { SoftwareLease, SoftwareLeaseService } from './software-lease';
import { Component, Injectable, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import {
  ResourceTableComponent,
  ResourceTableDataSource,
} from '../../common/resource-table.component';
import { ResourceTableInfoHeaderComponent } from '../../common/resource-table-info-header.component';
import { LabResourceContainerContext } from 'src/app/lab/lab-resource-consumer/resource-container';

@Component({
  selector: 'lab-software-lease-table',
  standalone: true,
  imports: [
    CommonModule,

    ResourceTableComponent,
    ResourceTableInfoHeaderComponent,
    MatTableModule,
  ],
  template: `
    <lab-resource-table
      resourceType="software-lease"
      [displayedColumns]="['name', 'min-version']"
      [detailTemplate]="detailTemplate"
    >
      <lab-resource-table-info-header>
        Software which must be installed on the computers available in the lab.
        Software only used outside the lab should be omitted
      </lab-resource-table-info-header>

      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let element">{{ element.name }}</td>
        <td></td
      ></ng-container>

      <ng-container matColumnDef="min-version">
        <th mat-header-cell *matHeaderCellDef>Min version</th>
        <td mat-cell *matCellDef="let element">{{ element.minVersion }}</td>
      </ng-container>

      <!--
        <ng-container matColumnDef="require-license">
            <th mat-header-cell *matHeaderCellDef>Requires License</th>
            <td mat-cell *matCellDef="let element">{{element.requiresLicence ? 'Yes' : 'No'}}</td>
        </ng-container>
        -->
    </lab-resource-table>

    <ng-template #detailTemplate let-element let-dataIndex="dataIndex">
      {{ element.description }}
    </ng-template>
  `,
})
export class SoftwareLeaseTableComponent {
}
