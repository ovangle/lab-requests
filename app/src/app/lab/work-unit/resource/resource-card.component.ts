import { Component, Input, inject } from "@angular/core";
import { Resource } from "./resource";
import { ResourceType } from "./resource-type";
import { EquipmentLeaseTableComponent } from "../resources/equipment/equipment-lease-table.component";
import { MatCardModule } from "@angular/material/card";
import { CommonModule } from "@angular/common";
import { SoftwareResourceTableComponent } from "../resources/software/software-resource-table.component";
import { ServiceResourceTableComponent } from "../resources/service/service-resource-table.component";
import { InputMaterialResourceTableComponent } from "../resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "../resources/material/output/output-material-resource-table.component";

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
    <mat-card>
        <mat-card-content [ngSwitch]="resourceType">
            <lab-equipment-lease-table *ngSwitchCase="'equipment'"></lab-equipment-lease-table>
            <lab-software-resource-table *ngSwitchCase="'software'"></lab-software-resource-table>
            <lab-service-resource-table *ngSwitchCase="'service'"></lab-service-resource-table>
            <lab-input-material-resource-table *ngSwitchCase="'input-material'"></lab-input-material-resource-table>
            <lab-output-material-resource-table *ngSwitchCase="'output-material'"></lab-output-material-resource-table>
        </mat-card-content>
    </mat-card>
    `
})
export class WorkUnitResourceCardComponent<T extends Resource> {
    @Input({required: true})
    resourceType: ResourceType;

    @Input()
    resources: readonly T[];
}