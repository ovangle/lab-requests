import { Component, Input, inject } from "@angular/core";
import { Equipment } from "./equipment";
import { Lab, LabService, injectLabService } from "../lab";
import { LabListComponent } from "../lab-list.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";

@Component({
    selector: 'lab-equipment-page-header',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        LabListComponent
    ],
    template: `
    <h1>
        {{equipment!.name}}

        <div class="edit-button">
            <button mat-raised-button [routerLink]="['/equipment', equipment!.id, 'edit']">
                Edit
            </button>
        </div>
    <h1>
    `,
    styles: `
    .edit-button {
        float: right;
    }
    `
})
export class LabEquipmentPageHeaderComponent {
    @Input({ required: true })
    equipment: Equipment | undefined;

}
