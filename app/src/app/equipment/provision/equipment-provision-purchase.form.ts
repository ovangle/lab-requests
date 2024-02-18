import { Component, EventEmitter, Input, Output } from "@angular/core";
import { LabEquipmentProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-purchase-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionPurchaseFormComponent {
  @Input({ required: true })
  equipmentProvision: LabEquipmentProvision | undefined;

  @Output()
  save = new EventEmitter<LabEquipmentProvision>();
}