import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { LabEquipmentProvisioningService } from "src/app/equipment/provision/equipment-provision";
import { ActivatedRoute } from "@angular/router";
import { shareReplay, switchMap } from "rxjs";
import { injectEquipmentService } from "../../../equipment/equipment";
import { EquipmentContext } from "../../../equipment/equipment-context";

function equipmentProvisionFromActivatedRoute() {
    const activatedRoute = inject(ActivatedRoute);
    const equipmentProvisions = inject(LabEquipmentProvisioningService);

    return activatedRoute.paramMap.pipe(
        switchMap(params => {
            const provisionId = params.get('provisionId');
            if (provisionId == null) {
                throw new Error('No :provision_id in route');
            }
            return equipmentProvisions.fetch(provisionId);
        })
    );
}

@Component({
    selector: 'lab-equipment-provision-details-page',
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    @if (provision$ | async; as provision) {
        @if (equipment$ | async; as equipment) {
            <!--
            <lab-equipment-page-header [equipment]="equipment">
            </lab-equipment-page-header>
            -->
        }
    }
    `,
    providers: [
        EquipmentContext
    ]
})
export class LabEquipmentProvisionDetailsPage {
    readonly equipmentService = injectEquipmentService();
    readonly equipmentContext = inject(EquipmentContext);
    readonly provision$ = equipmentProvisionFromActivatedRoute()

    readonly equipment$ = this.provision$.pipe(
        switchMap(provision => this.equipmentService.fetch(provision.equipment.id)),
        shareReplay(1)
    );

    ngOnInit() {
        this.equipmentContext.sendCommitted(this.equipment$)
    }
}