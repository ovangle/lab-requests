import { Component, Input } from "@angular/core";

import { CommonModule } from "@angular/common";
import { EquipmentRequest } from "./equipment-request";

@Component({
    selector: 'lab-equipment-request-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    <h1>(new) {{equipment.name}}</h1>

    <p>Reason</p>
    <p>{{equipment.reason}}
    `,
})
export class EquipmentRequestInfoComponent {
    @Input({required: true})
    equipment: EquipmentRequest;
}