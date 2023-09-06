import { Component, Injectable } from "@angular/core";
import { ResourceTableComponent, ResourceTableDataSource } from "../common/resource-table.component";
import { EquipmentLease } from "./equipment-lease";
import { ResourceTableInfoHeaderComponent } from "../common/resource-table-info-header.component";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from "@angular/common";


@Injectable()
export class EquipmentLeaseTableDataSource extends ResourceTableDataSource<EquipmentLease> {
    override readonly resourceType = 'equipment';
    override readonly resourceTitle = 'Equipment';
}

@Component({
    selector: 'lab-req-equipment-lease-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,
        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
    ],
    template: `
    <lab-req-resource-table
        [displayedColumns]="['name']"
        [detailTemplate]="detailTemplate">
        <lab-request-resource-table-info-header>
            Equipment represent permanent fixtures of the lab.
        </lab-request-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{element.name}}</th>
        </ng-container>

        <ng-container matColumnDef="is-trained">
            <th mat-header-cell *matHeaderCellDef="is-trained">Has completed required training</th>
            <td mat-cell *matCellDef="let element">{{element.isTrainingCompleted ? 'Yes': 'No'}}</td>
        </ng-container>

        <ng-container matColumnDef="requires-assistance">
            <th mat-header-cell *matHeaderCellDef="requires-assistance">Requests assistance</th>
            <td mat-cell *matCellDef="let element">{{element.requreAssistance ? 'Yes' : 'No'}}</td>
        </ng-container>

        <ng-container matColumnDef="requires-setup">
            <th mat-header-cell *matHeaderCellDef="requires-setup">Requires setup</th> 
            <td mat-cell *matCellDef="let element">
                {{element.setupInstructions ? 'Yes' : "No"}}
            </td>
        </ng-container>

        <ng-container matColumnDef="usage-cost">
            <th mat-header-cell *matHeaderCellDef="usage-cost">Usage cost (est)</th>
            <td mat-cell *matCellDef="let element">
                {{element.costEstimate ? element.costEstimate.estimatedCost : 'unknown'}}
            </td>
        </ng-container>
    </lab-req-resource-table>

    <ng-template #detailTemplate let-element>
    </ng-template>
    `,
    providers: [
        {
            provide: ResourceTableDataSource,
            useClass: EquipmentLeaseTableDataSource
        }
    ]
})
export class EquipmentLeaseTableComponent {

}