import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";

@Component({
    selector: 'lab-equipment-index-page',
    template: `
    <div>
        <a mat-button routerLink="./create">
            + Create
        </a>
    </div>

    <lab-equipment-list>
    </lab-equipment-list>
    `
})
export class EquipmentIndexPage {}