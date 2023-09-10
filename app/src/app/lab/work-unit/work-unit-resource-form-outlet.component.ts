import { Component, Injectable, inject } from "@angular/core";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "./work-unit";
import { Subscription, switchMap } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";

function workUnitContextFromFormHostRoute() {
    const activatedRoute = inject(ActivatedRoute);
    const models = inject(WorkUnitModelService);

    return activatedRoute.paramMap.pipe(
        switchMap(paramMap => {
            const workUnitId = paramMap.get('work_unit_id'); 
            if (workUnitId == null) {
                throw new Error('Work unit not found in route');
            }
            return models.fetch(workUnitId);
        })
    )
}


@Component({
    selector: 'lab-work-unit-resource-form-host',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    template: `
        <router-outlet></router-outlet>
    `,
    styles: [``],
    providers: [
        WorkUnitContext,
        WorkUnitResourceContainerContext
    ]
})
export class WorkUnitResourceFormOutlet {
    _workUnitContext = inject(WorkUnitContext);
    _workUnitContextConnection: Subscription;

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.connect(
            workUnitContextFromFormHostRoute()
        );
    }

    ngOnDestroy() {
        this._workUnitContextConnection.unsubscribe();
    }
}
