import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Equipment, EquipmentContext } from "./equipment";
import { Observable, Subscription, shareReplay, switchMap } from "rxjs";

@Injectable()
export class EquipmentContextFromRoute extends EquipmentContext {
    readonly route = inject(ActivatedRoute)

    override readonly fromContext$: Observable<Equipment> = this.route.paramMap.pipe(
        switchMap(params => {
            const equipmentId = params.get('equipment_id');
            if (!equipmentId) {
                throw new Error('No equipment in route');
            }
            return this.models.fetch(equipmentId);
        }),
        shareReplay(1)
    );

    override connect() {
        const sSubscription = super.connect();
        const fromContext__keepalive = this.fromContext$.subscribe()
        return new Subscription(() => {
            sSubscription.unsubscribe();
            fromContext__keepalive.unsubscribe();
        })
    }
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
        { provide: EquipmentContext, useClass: EquipmentContextFromRoute }
    ]
})
export class EquipmentDetailPage {
    readonly context = inject(EquipmentContext);
    _contextConnection: Subscription;

    ngOnInit() {
        this._contextConnection = this.context.connect();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }
}