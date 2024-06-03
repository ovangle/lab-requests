import { Component, Input, inject, input } from "@angular/core";
import { Equipment, EquipmentService } from "../equipment";
import { Lab } from "src/app/lab/lab";
import { EquipmentInstallation } from "./equipment-installation";
import { LabInstallationInfoComponent } from "src/app/lab/common/installable/lab-installation-info.component";
import { EquipmentInfoComponent } from "../equipment-info.component";
import { AsyncPipe } from "@angular/common";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";

export type EquipmentInstallationInfoDisplay
  = 'list-item'


@Component({
  selector: 'equipment-installation-info',
  standalone: true,
  imports: [
    AsyncPipe,
    LabInstallationInfoComponent,
    EquipmentInfoComponent
  ],
  template: `
  <lab-installation-info 
     [installation]="installation()" 
     [display]="display()">
    <div #installableTitle>
      @if (equipment$ | async; as equipment) {
        <equipment-info [equipment]="equipment" display="name-only" />
      }
    </div>

    <div #installationDetails>
      Num installed: {{installation().numInstalled}}
    </div>

  </lab-installation-info>
  `
})
export class EquipmentInstallationInfoComponent {
  installation = input.required<EquipmentInstallation>();
  display = input<EquipmentInstallationInfoDisplay>('list-item')

  protected readonly _equipmentService = inject(EquipmentService);
  equipment$ = toObservable(this.installation).pipe(
    switchMap(install => install.resolveEquipment(this._equipmentService))
  );
}