import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { ResourceTableComponent, ResourceTableDataSource } from "../common/resource-table.component";
import { RESOURCE_TYPE } from "../common/resource-form.component";
import { Equipment } from "./equipment";
import { MatTableModule } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EquipmentResourceDetailsComponent } from "./equipment-resource-details.component";
import { Observable, switchMap } from "rxjs";
import { EquipmentSchemaService } from "./schema/equipment-schema";
import { ExperimentalPlanService } from "../../experimental-plan/experimental-plan";
import { ResourceTableInfoHeaderComponent } from "../common/resource-table-info-header.component";

@Injectable()
export class EquipmentResourceTableDataSource extends ResourceTableDataSource<Equipment> {
    override readonly resourceType = 'equipment';
    override readonly resourceTitle = 'Equipment';
}


@Component({
    selector: 'lab-req-equipment-resource-table',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatTableModule,
        MatTooltipModule,
        ResourceTableComponent,

        ResourceTableInfoHeaderComponent,
        EquipmentResourceDetailsComponent
    ],
    template: `
    <lab-req-resource-table
        [displayedColumns]="['name', 'num-units', 'instruction', 'is-provisioned', 'requires-setup']"
        [detailTemplate]="detailTemplate">

        <lab-req-resource-table-info-header>
            Equipments represent permanent fixtures of the laboratory. Some items which would generally
            be called equipment should be instead listed as input materials. Consult the lab tech if you
            are unsure whether to list a given resource as equipment or not.
        </lab-req-resource-table-info-header>

        <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let element">{{element.schema.name}}<td>
        </ng-container>

        <ng-container matColumnDef="num-units">
            <th mat-header-cell *matHeaderCellDef>Units</th>
            <td mat-cell *matCellDef="let element">{{element.numRequested}}</td>
        </ng-container>

        <ng-container matColumnDef="is-provisioned">
            <th mat-header-cell *matHeaderCellDef>Is provisioned</th>
            <td mat-cell *matCellDef="let element">
                <mat-icon *ngIf="element.isProvisioned">check_circle</mat-icon>
                <mat-icon *ngIf="!element.isProvisioned">cancel</mat-icon>
            </td>
        </ng-container>

        <ng-container matColumnDef="instruction">
            <th mat-header-cell *matHeaderCellDef>Needs instruction</th>
            <td mat-cell *matCellDef="let element">
                <mat-icon *ngIf="(element.schema.requiresTraining && element.hasRequiredTraining) || element.requiresInstruction">check_circle</mat-icon>
                <mat-icon *ngIf="(element.schema.requiresTraining && !element.hasRequiredTraining) && !element.requiresInstruction">cancel</mat-icon>
            </td>
        </ng-container>

        <ng-container matColumnDef="requires-setup">
            <th mat-header-cell *matHeaderCellDef>Needs setup</th>
            <td mat-cell *matCellDef="let element">
                <mat-icon *ngIf="element.setupInstructions !== ''">check_circle</mat-icon>
                <mat-icon *ngIf="element.setupInstructions === ''">cancel</mat-icon>
            </td>
        </ng-container>
    </lab-req-resource-table>

    <ng-template #detailTemplate let-element let-index="index">
        <lab-req-equipment-resource-details [equipment]="element">
        </lab-req-equipment-resource-details>
    </ng-template>
    `,
    styles: [`
    .table-info {
        display: flex;
        margin-bottom: 0.5em;
    }
    .table-info p {
        margin-bottom: 0;
        padding-left: 1em;
    }
    `],
    providers: [
        {
            provide: ResourceTableDataSource,
            useClass: EquipmentResourceTableDataSource
        }

    ]
})
export class EquipmentResourceTableComponent {
    experimentalPlanService = inject(ExperimentalPlanService)
    schemaService = inject(EquipmentSchemaService);
}