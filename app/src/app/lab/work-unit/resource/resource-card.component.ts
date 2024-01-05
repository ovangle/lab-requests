import { Component, Input, inject } from "@angular/core";
import { Resource } from "./resource";
import { ResourceType } from "./resource-type";
import { EquipmentLeaseTableComponent } from "../resources/equipment/equipment-lease-table.component";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from "@angular/common";
import { SoftwareResourceTableComponent } from "../resources/software/software-resource-table.component";
import { ServiceResourceTableComponent } from "../resources/task/task-resource-table.component";
import { InputMaterialResourceTableComponent } from "../resources/input-material/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "../resources/output-material/output-material-resource-table.component";

@Component({
    selector: 'lab-work-unit-resource-card',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,

        EquipmentLeaseTableComponent,
        SoftwareResourceTableComponent,
        ServiceResourceTableComponent,
        InputMaterialResourceTableComponent,
        OutputMaterialResourceTableComponent
    ],
    template: `
        <ng-container [ngSwitch]="resourceType">
            <lab-equipment-lease-table *ngSwitchCase="'equipment'"></lab-equipment-lease-table>
            <lab-software-resource-table *ngSwitchCase="'software'"></lab-software-resource-table>
            <lab-task-resource-table *ngSwitchCase="'task'"></lab-task-resource-table>
            <lab-input-material-resource-table *ngSwitchCase="'input-material'"></lab-input-material-resource-table>
            <lab-output-material-resource-table *ngSwitchCase="'output-material'"></lab-output-material-resource-table>
        </ng-container>
    `
})
export class WorkUnitResourceInfo<T extends Resource> {
    @Input({ required: true })
    resourceType: ResourceType;

    @Input()
    resources: readonly T[];
}