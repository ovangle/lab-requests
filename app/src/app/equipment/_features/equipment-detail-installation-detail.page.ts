import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { EquipmentDetailSubpage, EquipmentDetailStateService } from "./equipment-detail.state";
import { ActivatedRoute } from "@angular/router";
import { Observable, combineLatest, map, shareReplay, switchMap, withLatestFrom } from "rxjs";
import { LabService } from "src/app/lab/lab";
import { EquipmentProvision, EquipmentProvisionService } from "../provision/equipment-provision";
import { ProvisionStatusPipe } from "src/app/lab/common/provisionable/provision-status.pipe";
import { EquipmentProvisionInfoComponent } from "../provision/equipment-provision-info.component";
import { isEqualModelRefs } from "src/app/common/model/model";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ProvisionStatusPipe,

        EquipmentProvisionInfoComponent
    ],
    template: `
    @if (installation$ | async; as installation) {
        <h2>
            @if (lab$ | async; as lab) {
                {{lab.name}} installation
            }
        </h2>

        @if (activeProvision$ | async; as activeProvisions) {
            @for (provision of activeProvisions; track provision.id) {
                <equipment-provision-info [provision]="provision" /> 
            }
        }
    }
    `
})
export class EquipmentDetailInstallationDetailPage implements EquipmentDetailSubpage {
    readonly subroute = 'installation-detail';
    readonly _labService = inject(LabService)
    readonly _equipmentContext = inject(EquipmentContext);
    readonly equipment$ = this._equipmentContext.committed$;

    readonly _equipmentDetailState = inject(EquipmentDetailStateService);

    readonly activatedRoute = inject(ActivatedRoute);


    readonly installation$ = this.activatedRoute.paramMap.pipe(
        map(params => params.get('installation_id')),
        withLatestFrom(this.equipment$),
        map(([ installationId, equipment ]) => {
            const install = equipment.currentInstallations.find(install => isEqualModelRefs(install, installationId));
            if (!install) {
                throw new Error(`No install found in equipment '${equipment.id}' installations with id \'${installationId}'`)
            }
            return install
        }),
        shareReplay(1)
    );

    readonly lab$ = this.installation$.pipe(
        switchMap(install => install.resolveLab(this._labService)),
        shareReplay(1)
    );

    _equipmentProvisionService = inject(EquipmentProvisionService);
    readonly activeProvisionPage$ = combineLatest([ this.equipment$, this.lab$ ]).pipe(
        switchMap(([ equipment, lab ]) => equipment.getActiveProvisions(lab, this._equipmentProvisionService) || null),
        shareReplay(1)
    );

    readonly activeProvision$ = this.activeProvisionPage$.pipe(
        map(page => page.items)
    );
}