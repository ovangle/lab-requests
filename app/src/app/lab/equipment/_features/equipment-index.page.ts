import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentCollection } from "../equipment";
import { map } from "rxjs";

@Component({
    selector: 'lab-equipment-index-page',
    template: `
    <h1>
        Equipment
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

    readonly equipments$ = this.equipmentCollection.resultPage$.pipe(
        map(resultPage => resultPage.items)
    );

}