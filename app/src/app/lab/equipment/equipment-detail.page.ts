import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Equipment, EquipmentContext, EquipmentModelService } from "./equipment";
import { Observable, Subscription, shareReplay, switchMap } from "rxjs";

function equipmentContextFromDetailRoute() {
    const route = inject(ActivatedRoute);
    const models = inject(EquipmentModelService);

    return route.paramMap.pipe(
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
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    template: `
    <ng-container *ngIf="context.equipment$ | async as equipment">
        <div>
            Name <br/>
            ==== <br />
            {{equipment.name}}
        </div>
        <div>
            Description <br />
            =========== <br />
            {{equipment.description}}
        </div>
    </ng-container>
    `,
    providers: [
        EquipmentContext,
    ]
})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    _contextConnection: Subscription;

    ngOnInit() {
        this._contextConnection = this.context.connect(
            equipmentContextFromDetailRoute()
        );
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }
}