import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { WorkUnit } from "../work-unit";
import { Resource, ResourceType } from "./common/resource";
import { EquipmentLeaseTableComponent } from "./equipment/equipment-lease-table.component";
import { SoftwareResourceTableComponent } from "./software/software-resource-table.component";
import { ServiceResourceTableComponent } from "./service/service-resource-table.component";
import { InputMaterialResourceTableComponent } from "./material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "./material/output/output-material-resource-table.component";
import { INPUT_MODALITY_DETECTOR_DEFAULT_OPTIONS } from "@angular/cdk/a11y";


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
            <ng-container *ngSwitchCase="'equipment'">
                <lab-equipment-lease-table></lab-equipment-lease-table>
            </ng-container>
            <ng-container *ngSwitchCase="'software'">
                <lab-software-resource-table></lab-software-resource-table>
            </ng-container>
            <ng-container *ngSwitchCase="'service'">
                <lab-service-resource-table></lab-service-resource-table>
            </ng-container>
            <ng-container *ngSwitchCase="'input-material'">
                <lab-input-material-resource-table></lab-input-material-resource-table>
            </ng-container>
            <ng-container *ngSwitchCase="'output-material'">
                <lab-output-material-resource-table></lab-output-material-resource-table>
            </ng-container>
        </mat-card-content>
    </mat-card>
    `
})
export class WorkUnitResourceCardComponent<T extends Resource> {
    @Input()
    resourceType: ResourceType;

    @Input()
    resources: readonly T[];
}