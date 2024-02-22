import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { EquipmentProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-install-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionInstallFormComponent {
  @Input({ required: true })
  equipmentProvision: EquipmentProvision | undefined;

  @Output()
  save = new EventEmitter<EquipmentProvision>();
}