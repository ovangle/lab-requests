import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, shareReplay, switchMap } from "rxjs";
import { Equipment, injectEquipmentService } from "src/app/lab/equipment/equipment";
import { EquipmentContext } from "src/app/lab/equipment/equipment-context";


export function equipmentFromActivatedRoute(): Observable<Equipment> {
    let activatedRoute = inject(ActivatedRoute);
    const equipments = injectEquipmentService();

    function isEquipmentIndexRoute(route: ActivatedRoute) {
        return route.routeConfig?.path?.includes('equipment');
    }

    while (activatedRoute.parent && !isEquipmentIndexRoute(activatedRoute.parent)) {
        activatedRoute = activatedRoute.parent;
    }
    if (!activatedRoute) {
        throw new Error('No equipment index route in path');
    }

    return activatedRoute.paramMap.pipe(
        switchMap(params => {
            const equipmentId = params.get('equipment_id');
            if (!equipmentId) {
                throw new Error('No :equipment_id in activated route');
            }
            return equipments.fetch(equipmentId)
        }),
        shareReplay(1)
    );
}

@Component({
    selector: '',
    standalone: true,
    imports: [
        CommonModule
    ],
    template: ``,
    providers: [
        EquipmentContext
    ]
})
export class EquipmentDetailPage {
    readonly equipment$ = equipmentFromActivatedRoute();
    readonly _context = inject(EquipmentContext);

    ngOnInit() {
        this._context.sendCommitted(this.equipment$);
    }
}