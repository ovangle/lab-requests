import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, defer, map, of, switchMap, withLatestFrom } from "rxjs";
import { WorkUnitBaseInfoComponent } from "../../base-info/work-unit-base-info.component";
import { ExperimentalPlanContext } from "../../../experimental-plan/experimental-plan";
import { WorkUnit, WorkUnitContext, WorkUnitModelService } from "../../work-unit";
import { ALL_RESOURCE_TYPES, ResourceType } from "../../resource/resource-type";
import { Resource } from "../../resource/resource";

class WorkUnitContextError extends Error {}

function workUnitFromDetailRoute(): Observable<WorkUnit | null> {
    const planContext = inject(ExperimentalPlanContext, {skipSelf: true, optional: true});

    const plan$ = planContext ? planContext.plan$ : of(null);

    const models = inject(WorkUnitModelService);
    const activatedRoute = inject(ActivatedRoute);

    return defer(() => plan$.pipe(
        withLatestFrom(activatedRoute.paramMap),
        switchMap(([plan, params]) => {
            if (plan != null) {
                const workUnitIndex = Number.parseInt(params.get('work_unit_index')!);
                if (Number.isNaN(workUnitIndex)) {
                    throw new WorkUnitContextError('Invalid route. Expected :work_unit_index in params');
                }

                return models.readByPlanAndIndex(plan, workUnitIndex);
            } else {
                const workUnitId = params.get('work_unit_id');
                if (typeof workUnitId != 'string') {
                    throw new WorkUnitContextError('Invalid route. Expected :work_unit_index in params');
                }
                return models.readById(workUnitId);
            }
        })
    ));
}


@Component({
    template: `
    <ng-container *ngIf="workUnit$ | async as workUnit">
        <lab-work-unit-base-info [workUnit]="workUnit">
        </lab-work-unit-base-info>

        <div class="resources">
            <lab-work-unit-resource-card *ngFor="let resourceType of RESOURCE_TYPES"
                [resourceType]="resourceType"
                [resources]="(getResources(resourceType) | async) || []">
            </lab-work-unit-resource-card>
        </div>
    </ng-container>
    `
})
export class WorkUnitDetailPage {
    readonly RESOURCE_TYPES = ALL_RESOURCE_TYPES;

    readonly _workUnitContext = inject(WorkUnitContext);
    readonly _workUnitContextConnection: Subscription;
    readonly workUnit$ = this._workUnitContext.workUnit$;

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.sendCommitted(workUnitFromDetailRoute());
    }

    ngOnDestroy() {
        this._workUnitContextConnection.unsubscribe();
    }

    getResources<T extends Resource>(resourceType: ResourceType): Observable<readonly T[]> {
        return this.workUnit$.pipe(
            map(workUnit => workUnit!.getResources<T>(resourceType))
        )
    }
}