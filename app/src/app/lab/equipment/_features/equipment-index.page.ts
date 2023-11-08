import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { map } from "rxjs";
import { EquipmentCollection } from "../common/equipment";

@Component({
    selector: 'lab-equipment-index-page',
    template: `
    <h1>
        Lab Equipment
        <a mat-raised-button class="create-button" 
            color="primary"
            routerLink="./create">
            + Create
        </a>
    </h1>

    <ng-container *ngIf="equipments$ | async as equipments">
        <lab-equipment-list [equipments]="equipments">
        </lab-equipment-list>
    </ng-container>
    `,
    styles: [`
    a.create-button {
        float: right;
    }
    `],
    providers: [
        EquipmentCollection
    ]
})
export class EquipmentIndexPage {
    readonly equipmentCollection = inject(EquipmentCollection);

    readonly equipments$ = this.equipmentCollection.pageItems$;
}