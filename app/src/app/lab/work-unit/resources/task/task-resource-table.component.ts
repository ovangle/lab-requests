import { Component, Injectable } from "@angular/core";
import { Task } from "./task";
import { CommonModule } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { TaskResourceDetailsComponent } from "./task-resource-details.component";
import { ResourceTableInfoHeaderComponent } from "../../resource/common/resource-table-info-header.component";
import { ResourceTableDataSource, ResourceTableComponent } from "../../resource/common/resource-table.component";

@Injectable()
export class ServiceResourceTableDataSource extends ResourceTableDataSource<Task> {
    override readonly resourceType = 'task';
    override readonly resourceTitle = 'Tasks';
}

@Component({
    selector: 'lab-task-resource-table',
    standalone: true,
    imports: [
        CommonModule,

        MatTableModule,

        ResourceTableComponent,
        ResourceTableInfoHeaderComponent,
        TaskResourceDetailsComponent
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
        <lab-task-resource-details [task]="element">
        </lab-task-resource-details>
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