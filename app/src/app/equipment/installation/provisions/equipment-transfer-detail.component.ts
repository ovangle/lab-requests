import { Component, input } from "@angular/core";
import { EquipmentTransferRequest } from "../../provision/equipment-provision";
import { CommonModule } from "@angular/common";


@Component({
    selector: 'equipment-transfer-detail',
    standalone: true,
    imports: [
        CommonModule,

    ],
    template: `
    `

})
export class EquipmentTransferDetail {
    transfer = input.required<EquipmentTransferRequest>();
}