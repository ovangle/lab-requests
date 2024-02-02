import { Component, Input, inject } from "@angular/core";
import { Equipment } from "./equipment";
import { Lab, LabService, injectLabService } from "../lab";
import { LabListComponent } from "../lab-list.component";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'lab-equipment-page-header',
    standalone: true,
    imports: [
        CommonModule,
        LabListComponent
    ],
    template: `
    <h1>{{equipment!.name}}<h1>
    `
})
export class LabEquipmentPageHeaderComponent {
    @Input({ required: true })
    equipment: Equipment | undefined;
}
