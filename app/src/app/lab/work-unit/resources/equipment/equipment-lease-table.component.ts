import { Component, Injectable, inject } from "@angular/core";
import { EquipmentLease } from "./equipment-lease";
import { MatTableModule } from "@angular/material/table";
import { CommonModule } from "@angular/common";
import { ResourceTableComponent, ResourceTableDataSource } from "../../resource/common/resource-table.component";
import { ResourceTableInfoHeaderComponent } from "../../resource/common/resource-table-info-header.component";
import { CollectionViewer } from "@angular/cdk/collections";
import { Observable, forkJoin, switchMap } from "rxjs";
import { EquipmentModelService } from "src/app/lab/equipment/equipment";


@Injectable()
export class EquipmentLeaseTableDataSource extends ResourceTableDataSource<EquipmentLease> {
    override readonly resourceType = 'equipment';
    override readonly resourceTitle = 'Equipment';

    readonly equipments = inject(EquipmentModelService);


    override connect(collectionViewer: CollectionViewer): Observable<readonly EquipmentLease[]> {
        return super.connect(collectionViewer).pipe(
            switchMap(equipmentLeases => {
                const resolved = equipmentLeases.map(lease => lease.resolveEquipment(this.equipments))
                return forkJoin(resolved);
            })
        );
    }


}

@Component({
    selector: 'lab-equipment-lease-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,
        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
    ],
    template: `
    <lab-resource-table
        [displayedColumns]="['name', 'is-trained', 'requires-assistance', 'requires-setup']"
        [detailTemplate]="detailTemplate">
        <lab-resource-table-info-header>
            Equipment represent permanent fixtures of the lab.
        </lab-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">
                {{element.equipment.name}}
            </td>
        </ng-container>

        <ng-container matColumnDef="is-trained">
            <th mat-header-cell *matHeaderCellDef>Has completed required training</th>
            <td mat-cell *matCellDef="let element">{{element.isTrainingCompleted ? 'Yes': 'No'}}</td>
        </ng-container>

        <ng-container matColumnDef="requires-assistance">
            <th mat-header-cell *matHeaderCellDef>Requests assistance</th>
            <td mat-cell *matCellDef="let element">{{element.requreAssistance ? 'Yes' : 'No'}}</td>
        </ng-container>

        <ng-container matColumnDef="requires-setup">
            <th mat-header-cell *matHeaderCellDef>Requires setup</th> 
            <td mat-cell *matCellDef="let element">
                {{element.setupInstructions ? 'Yes' : "No"}}
            </td>
        </ng-container>

        <ng-container matColumnDef="usage-cost">
            <th mat-header-cell *matHeaderCellDef>Usage cost (est)</th>
            <td mat-cell *matCellDef="let element">
                {{element.costEstimate ? element.costEstimate.estimatedCost : 'unknown'}}
            </td>
        </ng-container>
    </lab-resource-table>

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