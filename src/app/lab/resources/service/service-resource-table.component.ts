import { Component, Injectable } from "@angular/core";
import { ResourceTableComponent, ResourceTableDataSource } from "../common/resource-table.component";
import { Service } from "./service";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { ResourceTableInfoHeaderComponent } from "../common/resource-table-info-header.component";
import { ServiceResourceDetailsComponent } from "./service-resource-details.component";

@Injectable()
export class ServiceResourceTableDataSource extends ResourceTableDataSource<Service> {
    override readonly resourceType = 'service';
    override readonly resourceTitle = 'Service';
}

@Component({
    selector: 'lab-req-service-resource-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,

        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
        ServiceResourceDetailsComponent
    ],
    template: `
    <lab-req-resource-table
        [displayedColumns]="['name']"
        [detailTemplate]="detailTemplate">
        <lab-req-resource-table-info-header>
        </lab-req-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{element.name}}</td>
        </ng-container>

    </lab-req-resource-table>

    <ng-template #detailTemplate let-element let-index="index">
        <lab-req-service-resource-details [service]="element">
        </lab-req-service-resource-details>
    </ng-template>
    `,
    providers: [
        {
            provide: ResourceTableDataSource,
            useClass: ServiceResourceTableDataSource
        }
    ]

})
export class ServiceResourceTableComponent {}