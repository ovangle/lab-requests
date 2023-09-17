import { Component, Input, inject } from "@angular/core";
import { Resource } from "../../resource";
import { ResourceType } from "../../resource-type";

@Component({
    selector: 'lab-work-unit-resource-card',
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