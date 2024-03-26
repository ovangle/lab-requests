import { Component, Injectable, inject } from '@angular/core';
import { OutputMaterial, OutputMaterialService } from './output-material';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import {
  ResourceTableComponent,
  ResourceTableDataSource,
} from '../../lab-resource/common/resource-table.component';

@Injectable()
export class OutputMaterialTableDataSource extends ResourceTableDataSource<OutputMaterial> {
  override readonly resourceType = 'output-material';
  override readonly resourceTitle = 'Output material';
  override readonly resourceService = inject(OutputMaterialService);
}

@Component({
  selector: 'lab-output-material-table',
  standalone: true,
  imports: [ CommonModule, MatTableModule, ResourceTableComponent ],
  template: `
    <lab-resource-table
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
  providers: [
    OutputMaterialService,
    {
      provide: ResourceTableDataSource,
      useClass: OutputMaterialTableDataSource,
    },
  ],
})
export class OutputMaterialTableComponent { }
