import { Component, EventEmitter, Input, Output } from "@angular/core";
import { EquipmentInstallationProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-approval-form',
  standalone: true,
  imports: [
  ],
  template: ``
})
export class EquipmentProvisionApprovalFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentInstallationProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentInstallationProvision>();
}