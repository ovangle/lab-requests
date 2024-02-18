import { Component, Input } from "@angular/core";
import { Equipment } from "../equipment";
import { Lab } from "src/app/lab/lab";
import { EquipmentInstallation } from "./equipment-installation";


@Component({
  selector: 'equipment-installation-info',
  standalone: true,
  template: `
  <p>{{installation?.numInstalled || 0}} existing installs</p>
  @if (pendingInstallation) {
    <p>{{pendingInstallation.numInstalled || 0}} after provision</p>
  }

  `

})
export class EquipmentInstallationInfoComponent {
  @Input({ required: true })
  equipment: Equipment | undefined;

  @Input({ required: true })
  lab: Lab | undefined;

  get installation(): EquipmentInstallation | null {
    return this.equipment!.currentLabInstallation(this.lab!);
  }

  get pendingInstallation(): EquipmentInstallation | null {
    return this.equipment!.pendingLabInstallation(this.lab!);
  }
}