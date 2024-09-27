import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EquipmentInstallationProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-purchase-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionPurchaseFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentInstallationProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentInstallationProvision>();
}