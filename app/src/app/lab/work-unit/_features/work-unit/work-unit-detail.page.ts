import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, defer, map, of, switchMap, withLatestFrom } from "rxjs";
import { WorkUnitBaseInfoComponent } from "../../base-info/work-unit-base-info.component";
import { ALL_RESOURCE_TYPES, ResourceType } from "../../resource/resource-type";
import { Resource } from "../../resource/resource";
import { ExperimentalPlanFormPaneControlService } from "src/app/lab/experimental-plan/experimental-plan-form-pane-control.service";
import { WorkUnit, WorkUnitContext, WorkUnitResourceContainerContext, WorkUnitService } from "../../common/work-unit";
import { ExperimentalPlan, ExperimentalPlanContext } from "src/app/lab/experimental-plan/common/experimental-plan";
import { ExperimentalPlanWorkUnitService } from "src/app/lab/experimental-plan/work-units/work-units";
import { HttpParams } from "@angular/common/http";
import { ResourceContainerContext } from "../../resource/resource-container";

class WorkUnitContextError extends Error {}

function workUnitFromDetailRoute(): Observable<WorkUnit> {
    const workUnitService = inject(WorkUnitService);
    const workUnitPlanService = inject(ExperimentalPlanWorkUnitService, {optional: true})

    function readByPlanAndIndex(index: string | number) {
        if (workUnitPlanService == null) {
            throw new Error('Requires an experimental plan context');
        }
        return workUnitPlanService.fetch(index);
    }

    const models = inject(WorkUnitService);
    const activatedRoute = inject(ActivatedRoute);

    return activatedRoute.paramMap.pipe(
        switchMap(params => {
            if (params.has('work_unit_index')) {
                return readByPlanAndIndex(params.get('work_unit_index')!);
            } else if (params.has('work_unit_id')) {
                return workUnitService.fetch(params.get('work_unit_id')!);
            } else {
                throw new Error('Params must contain either work_unit_index or work_unit_id');
            }
        })
    )
    
}

@Component({
    selector: 'lab-work-unit-detail-page',
    template: `
    <button mat-button (click)="openUpdateForm()">
        <mat-icon>update</mat-icon>
    </button>

    <div *ngIf="workUnit$ | async as workUnit" class="container">
                <lab-work-unit-base-info [workUnit]="workUnit">
        </lab-work-unit-base-info>

        <lab-work-unit-duration-info [workUnit]="workUnit" />
    </div>

 
    <div class="resources">
        <lab-work-unit-resource-card *ngFor="let resourceType of RESOURCE_TYPES"
            [resourceType]="resourceType"
            [resources]="(getResources(resourceType) | async) || []">
        </lab-work-unit-resource-card>
    </div>
    `,
    styles: [`
    .container {
        display: flex;
    }
    lab-work-unit-base-info {
        flex-grow: 1;
    }
    lab-work-unit-duration-info {
        flex-grow: 0;
        flex-shrink: 0;
    }
    `],
    providers: [
        WorkUnitContext,
        {
            provide: ResourceContainerContext,
            useClass: WorkUnitResourceContainerContext
        }
    ]
})
export class WorkUnitDetailPage {
    readonly RESOURCE_TYPES = ALL_RESOURCE_TYPES;

    readonly _workUnitContext = inject(WorkUnitContext);
    readonly _workUnitContextConnection: Subscription;
    readonly workUnit$ = this._workUnitContext.workUnit$;

    readonly _formPane = inject(ExperimentalPlanFormPaneControlService);

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

    openUpdateForm() {
        this.workUnit$.pipe(
            switchMap(workUnit => {
                if (!workUnit) {
                    throw new Error('Work unit detail has no work unit');
                }
                return this._formPane.open(['work-units', `${workUnit.index}`, 'update']);
            })
        ).subscribe();
    }
}