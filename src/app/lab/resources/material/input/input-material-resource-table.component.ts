import { Component, Injectable } from "@angular/core";
import { ResourceTableComponent, ResourceTableDataSource } from "../../common/resource-table.component";
import { InputMaterial } from "./input-material";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { HazardClassLabelsComponent } from "../../common/hazardous/hazard-classes-labels.component";
import { ResourceStorageDetailsComponent } from "../../common/storage/resource-storage-details.component";


@Injectable()
export class InputMaterialResourceTableDataSource extends ResourceTableDataSource<InputMaterial> {
    override readonly resourceType = 'input-material';
    override readonly resourceTitle = 'Input material'
}

@Component({
    selector: 'lab-req-input-material-resource-table',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,

        ResourceTableComponent,

        ResourceStorageDetailsComponent,
        HazardClassLabelsComponent
    ],
    template: `
        <lab-req-resource-table
            [displayedColumns]="['name', 'numUnitsRequired', 'storage', 'hazards']"
            [detailTemplate]="detailTemplate">
            <tr matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let element">
                    {{element.name}}
                </td>
            </tr>

            <tr matColumnDef="numUnitsRequired">
                <th mat-header-cell *matHeaderCellDef>Amount required</th>
                <td mat-cell *matCellDef="let element">
                    {{element.numUnitsRequired}} {{element.baseUnit}}
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
                    <lab-req-hazard-class-labels [hazardClasses]="element.hazardClasses">
                    </lab-req-hazard-class-labels>
                </td>
            </tr>
        </lab-req-resource-table>

        <ng-template #detailTemplate let-element>
            <lab-req-resource-storage [storage]="element.storage">
            </lab-req-resource-storage>
        </ng-template>
    `,
    providers: [
        {provide: ResourceTableDataSource, useClass: InputMaterialResourceTableDataSource}
    ]
})
export class InputMaterialResourceTableComponent {

}