import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { LabEquipmentProvision } from "./equipment-provision";


@Component({
  selector: 'equipment-provision-install-form',
  standalone: true,
  template: ``
})
export class EquipmentProvisionInstallFormComponent {
  @Input({ required: true })
  equipmentProvision: LabEquipmentProvision | undefined;

  @Output()
  save = new EventEmitter<LabEquipmentProvision>();
}