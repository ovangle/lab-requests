import { CollectionViewer } from "@angular/cdk/collections";
import { Observable } from "rxjs";
import { Resource } from "../common/resource";
import { ResourceTableComponent, ResourceTableDataSource } from "../common/resource-table.component";
import { Software } from "./software";
import { Component, Injectable, inject } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { ResourceTableInfoHeaderComponent } from "../common/resource-table-info-header.component";
import { CommonModule } from "@angular/common";

@Injectable()
export class SoftwareResourceTableDataSource extends ResourceTableDataSource<Software> {
    override readonly resourceType = 'software';
    override readonly resourceTitle = 'Software';
}

@Component({
    selector: 'lab-req-software-resource-table',
    standalone: true,
    imports: [
        CommonModule,

        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
        MatTableModule
    ],
    template: `
    <lab-req-resource-table
        [displayedColumns]="['name', 'min-version']"
        [detailTemplate]="detailTemplate">

        <lab-req-resource-table-info-header>
            Software which must be installed on the computers available in the lab.
            Software only used outside the lab should be omitted
        </lab-req-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{element.name}}<td>
        </ng-container>

        <ng-container matColumnDef="min-version">
            <th mat-header-cell *matHeaderCellDef>Min version</th>
            <td mat-cell *matCellDef="let element">{{element.minVersion}}</td>
        </ng-container>

        <!--
        <ng-container matColumnDef="require-license">
            <th mat-header-cell *matHeaderCellDef>Requires License</th>
            <td mat-cell *matCellDef="let element">{{element.requiresLicence ? 'Yes' : 'No'}}</td>
        </ng-container>
        -->
    </lab-req-resource-table>

    <ng-template #detailTemplate let-element let-dataIndex="dataIndex">
        {{element.description}}
    </ng-template>
    `,
    providers: [
        {
            provide: ResourceTableDataSource,
            useClass: SoftwareResourceTableDataSource
        }
    ]
})
export class SoftwareResourceTableComponent {

}