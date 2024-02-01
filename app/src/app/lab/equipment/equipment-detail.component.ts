import { Component, Input, inject } from "@angular/core";
import { Equipment } from "./equipment";
import { Lab, LabService, injectLabService } from "../lab";
import { LabListComponent } from "../lab-list.component";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'lab-equipment-detail',
    standalone: true,
    imports: [
        CommonModule,
        LabListComponent
    ],
    template: ``
})
export class LabEquipmentDetailComponent {
    readonly labsService = injectLabService();

    @Input({ required: true })
    equipment: Equipment | undefined;

    @Input({ required: true })
    installedIn: Lab[] = [];
}
