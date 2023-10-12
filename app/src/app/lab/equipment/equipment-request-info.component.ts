import { Component, Input } from "@angular/core";
import { EquipmentRequest } from "./equipment";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'lab-equipment-request-info',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: `
    (new) {{equipment.name}}

    <p>Reason</p>
    <p>{{equipment.description}}
    `,
})
export class EquipmentRequestInfoComponent {
    @Input({required: true})
    equipment: EquipmentRequest;
}