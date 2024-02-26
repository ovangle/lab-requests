import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { EquipmentDetailSubpage, EquipmentDetailStateService } from "./equipment-detail.state";
import { ActivatedRoute } from "@angular/router";
import { Observable, combineLatest, map, shareReplay, switchMap, withLatestFrom } from "rxjs";
import { LabService } from "src/app/lab/lab";
import { EquipmentProvision } from "../provision/equipment-provision";
import { ProvisionStatusPipe } from "../provision/provision-status.pipe";
import { EquipmentProvisionCardComponent } from "../provision/equipment-provision-card.component";


@Component({
    standalone: true,
    imports: [
        CommonModule,
        ProvisionStatusPipe,

        EquipmentProvisionCardComponent
    ],
    template: `
    @if (installation$ | async; as installation) {
        <h2>
            @if (lab$ | async; as lab) {
                {{lab.name}} installation
            }
        </h2>

        @if (activeProvision$ | async; as activeProvision) {
            <equipment-provision-card [provision]="activeProvision" /> 
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
            const install = equipment.installations.find(install => install.id === installationId)
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

    readonly activeProvision$: Observable<EquipmentProvision | null> = combineLatest([ this.equipment$, this.lab$ ]).pipe(
        map(([ equipment, lab ]) => equipment.activeProvision(lab) || null)
    );
}