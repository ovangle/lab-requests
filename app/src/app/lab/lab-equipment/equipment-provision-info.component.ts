import { CommonModule } from "@angular/common";
import { Component, Input, computed, inject, input } from "@angular/core";
import { EquipmentProvision } from "../../equipment/provision/equipment-provision";
import { MatCardModule } from "@angular/material/card";
import { Equipment, EquipmentService } from "src/app/equipment/equipment";
import { LabProvisionInfoComponent } from "../common/provisionable/provision-info.component";
import { toObservable } from "@angular/core/rxjs-interop";
import { EquipmentInstallationService } from "src/app/equipment/installation/equipment-installation";
import { switchMap } from "rxjs";

@Component({
    selector: 'lab-equipment-provision-info',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,

        LabProvisionInfoComponent
    ],
    template: `
    <lab-provision-info
        [provision]="provision()">

        <div #provisionTypeInfo>
            @switch (provisionType()) {
                @case ('new_equipment') {
                    'New equipment'
                }
                @default {
                    Unrecognised equipment provision type {{provisionType()}}
                }
            }
        </div>

        <div #provisionTargetInfo>
            @if (equipmentInstallation$ | async; as installation) {
                {{installation.name}}
            }
        </div>
   `
})
export class LabEquipmentProvisionInfoComponent {
    readonly equipmentInstallationService = inject(EquipmentInstallationService);

    provision = input.required<EquipmentProvision>();
    provisionType = computed(() => this.provision().type);

    equipmentInstallation$ = toObservable(this.provision).pipe(
        switchMap(provision => provision.resoleTarget(this.equipmentInstallationService))
    );

}