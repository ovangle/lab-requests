import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ActivatedRoute } from "@angular/router";
import { map, Observable, switchMap } from "rxjs";
import { ScaffoldFormPaneControl } from "src/app/scaffold/form-pane/form-pane-control";
import { EquipmentProvisionService } from "../provision/equipment-provision";
import { EquipmentLease, EquipmentLeaseService } from "../lease/equipment-lease";

function equipmentLeaseFromRoute(): Observable<EquipmentLease> {
    const route = inject(ActivatedRoute);
    const equipmentLeaseService = inject(EquipmentLeaseService);

    return route.paramMap.pipe(
        map(params => params.get('lease_id')),
        switchMap(provisionId => {
            if (provisionId == null) {
                throw new Error(`No lease_id in route params`);
            }
            return equipmentLeaseService.fetch(provisionId);
        })
    );
}

@Component({
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule
    ],
    template: ``
})
export class ReviewEquipmentLeaseForm {
    readonly formPane = inject(ScaffoldFormPaneControl);

    equipmentProvision$ = equipmentLeaseFromRoute();


}