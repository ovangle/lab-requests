import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EquipmentProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-purchase-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionPurchaseFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentProvision>();
}