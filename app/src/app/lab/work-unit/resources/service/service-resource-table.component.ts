import { Component, Injectable } from "@angular/core";
import { Service } from "./service";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { ServiceResourceDetailsComponent } from "./service-resource-details.component";
import { ResourceTableInfoHeaderComponent } from "../../resource/common/resource-table-info-header.component";
import { ResourceTableDataSource, ResourceTableComponent } from "../../resource/common/resource-table.component";

@Injectable()
export class ServiceResourceTableDataSource extends ResourceTableDataSource<Service> {
    override readonly resourceType = 'service';
    override readonly resourceTitle = 'Service';
}

@Component({
    selector: 'lab-service-resource-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,

        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
        ServiceResourceDetailsComponent
    ],
    template: `
    <lab-resource-table
        [displayedColumns]="['name']"
        [detailTemplate]="detailTemplate">
        <lab-resource-table-info-header>
        </lab-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{element.name}}</td>
        </ng-container>

    </lab-resource-table>

    <ng-template #detailTemplate let-element let-index="index">
        <lab-service-resource-details [service]="element">
        </lab-service-resource-details>
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