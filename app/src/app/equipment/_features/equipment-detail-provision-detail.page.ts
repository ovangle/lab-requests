import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { EquipmentContext } from "../equipment-context";
import { EquipmentDetailStateService } from "./equipment-detail.state";


@Component({
    standalone: true,
    imports: [
        CommonModule,
    ],
    template: `
    `
})
export class EquipmentDetailProvisionDetailPage {
    readonly _equipmentContext = inject(EquipmentContext);
    readonly equipment$ = this._equipmentContext.committed$;

    readonly _equipmentDetailState = inject(EquipmentDetailStateService);

    ngOnInit() {
        this._equipmentDetailState.dispatch(setProvisionDetailSubroute);
    }

}