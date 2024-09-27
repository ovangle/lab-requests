import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { EquipmentInstallationProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-install-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionInstallFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentInstallationProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentInstallationProvision>();
}