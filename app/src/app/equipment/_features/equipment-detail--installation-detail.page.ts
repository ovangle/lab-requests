import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { EquipmentDetailSubpage, EquipmentDetailStateService } from "./equipment-detail.state";
import { ActivatedRoute } from "@angular/router";
import { Observable, combineLatest, map, shareReplay, switchMap, withLatestFrom } from "rxjs";
import { Lab, LabService } from "src/app/lab/lab";
import { EquipmentInstallationProvision, EquipmentProvisionService } from "../provision/equipment-provision";
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
        map(([installationId, equipment]) => {
            const install = equipment.installations.items.find(install => isEqualModelRefs(install, installationId));
            if (!install) {
                throw new Error(`No install found in equipment '${equipment.id}' installations with id \'${installationId}'`)
            }
            return install
        }),
        shareReplay(1)
    );

    readonly lab$: Observable<Lab> = this.installation$.pipe(
        switchMap(install => this._labService.fetch(install.labId)),
        shareReplay(1)
    );

    _equipmentProvisionService = inject(EquipmentProvisionService);
    readonly activeProvisionPage$ = this.installation$.pipe(
        switchMap((install) => this._equipmentProvisionService.getActiveProvisionsPage(install)),
        shareReplay(1)
    );

    readonly activeProvision$ = this.activeProvisionPage$.pipe(
        map(page => page.items)
    );
}