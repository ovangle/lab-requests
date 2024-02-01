import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentProvisioningService } from "../provision/lab-equipment-provision";
import { ActivatedRoute } from "@angular/router";
import { switchMap } from "rxjs";
import { LabEquipmentDetailComponent } from "../equipment-detail.component";

function equipmentProvisionFromActivatedRoute() {
    const activatedRoute = inject(ActivatedRoute);
    const equipmentProvisions = inject(EquipmentProvisioningService);

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
    selector: 'lab-equipment-provisioin-details-page',
    standalone: true,
    imports: [
        CommonModule,
        LabEquipmentDetailComponent,
    ],
    template: `
    @if (provision$ | async; as provision) {
        <div class="title">
            Equipment provision request
        </div>

        <div class="content">
            <lab-equipment-detail>{{provision.equipment}}</lab-equipment-detail>
        </div>
    }
    `
})
export class LabEquipmentProvisionDetailsPage {
    readonly provision$ = equipmentProvisionFromActivatedRoute()

}