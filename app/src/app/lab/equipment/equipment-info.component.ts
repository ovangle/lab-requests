import { Component, Input } from "@angular/core";
import { Equipment } from "./equipment";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import {EquipmentTagChipsComponent } from './tag/equipment-tag-chips.component';


@Component({
    selector: 'lab-equipment-info', 
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,

        EquipmentTagChipsComponent
    ],
    template: `
    <h2>
        <a [routerLink]="['/lab/equipments', equipment.id]">{{equipment.name}}</a>
    </h2>

    <p>{{equipment.description}}</p>

    <lab-equipment-tag-chips [tags]="equipment.tags">
    </lab-equipment-tag-chips> 
    `,
    styles: [`
    `]
})
export class EquipmentInfoComponent {
    @Input() equipment: Equipment;
}