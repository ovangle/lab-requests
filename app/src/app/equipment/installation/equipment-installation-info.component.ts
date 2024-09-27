import { Component, Input, inject, input } from "@angular/core";
import { EquipmentService } from "../equipment";
import { EquipmentInstallation } from "./equipment-installation";
import { LabInstallationInfoComponent } from "src/app/lab/common/installable/lab-installation-info.component";
import { EquipmentInfoComponent } from "../equipment-info.component";
import { AsyncPipe } from "@angular/common";
import { toObservable } from "@angular/core/rxjs-interop";
import { map, switchMap } from "rxjs";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { LabInstallableService } from "src/app/lab/common/installable/installable";

export type EquipmentInstallationInfoDisplay
  = 'list-item' | 'title'


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
  `,
  providers: [
    { provide: LabInstallableService, useExisting: EquipmentService }
  ]
})
export class EquipmentInstallationInfoComponent {

  installation = input.required<EquipmentInstallation>();
  display = input<EquipmentInstallationInfoDisplay>('list-item')

  hideProvisions = input(false, { transform: coerceBooleanProperty });

  protected readonly _equipmentService = inject(EquipmentService);
  equipment$ = toObservable(this.installation).pipe(
    switchMap(install => this._equipmentService.fetch(install.equipmentId))
  );
}