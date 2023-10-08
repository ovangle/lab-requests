import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { Equipment } from "./equipment";
import { MatListModule } from "@angular/material/list";
import { EquipmentTagChipsComponent } from "./tag/equipment-tag-chips.component";
import { RouterModule } from "@angular/router";


@Component({
    selector: 'lab-equipment-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        MatListModule,
        MatTableModule,

        EquipmentTagChipsComponent
    ],
    template: `
    <mat-list>
        <a mat-list-item *ngFor="let equipment of equipments"
           [routerLink]="['./', equipment.id]">
            <span matListItemTitle>{{equipment.name}}</span>
            <span matListItemLine>{{equipment.description}}</span>
            <span matListItemMeta>
                <lab-equipment-tag-chips [tags]="equipment.tags"></lab-equipment-tag-chips>
            </span>
        </a>
    </mat-list>
    `,
    styles: [`
    span.mat-mdc-list-item-meta {
        display: flex !important;
        flex-basis: 60%;
        justify-content: flex-end;
    }
    `]
})
export class LabEquipmentListComponent {
    @Input({required: true})
    equipments: Equipment[];
}