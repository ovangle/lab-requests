import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Equipment, EquipmentContext, EquipmentModelService } from "../equipment";
import { Observable, Subscription, shareReplay, switchMap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

function equipmentContextFromDetailRoute() {
    const route = inject(ActivatedRoute);
    const models = inject(EquipmentModelService);

    return route.paramMap.pipe(
        takeUntilDestroyed(),
        switchMap(params => {
            const equipmentId = params.get('equipment_id');
            if (!equipmentId) {
                throw new Error('No equipment in route');
            }
            return models.fetch(equipmentId);
        }),
        shareReplay(1)
    );
}


@Component({
    selector: 'lab-equipment-detail-page',
    template: `
    <ng-container *ngIf="context.equipment$ | async as equipment">
        <lab-equipment-info [equipment]="equipment"></lab-equipment-info>
    </ng-container>
    `
})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    _contextConnection: Subscription;

    constructor() {
        this._contextConnection = this.context.sendCommitted(
            equipmentContextFromDetailRoute()
        );
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }
}