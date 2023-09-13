import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { WorkUnit, WorkUnitContext, WorkUnitModelService } from "./work-unit";
import { ActivatedRoute } from "@angular/router";
import { Observable, Subscription, defer, map, of, switchMap, withLatestFrom } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanModelService } from "../experimental-plan/experimental-plan";
import { EquipmentLeaseTableComponent } from "./resources/equipment/equipment-lease-table.component";
import { SoftwareResourceTableComponent } from "./resources/software/software-resource-table.component";
import { InputMaterialResourceTableComponent } from "./resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "./resources/material/output/output-material-resource-table.component";
import { MatCardModule } from "@angular/material/card";
import { WorkUnitResourceCardComponent } from "./resources/resource-card.component";
import { ALL_RESOURCE_TYPES, RESOURCE_TYPE_NAMES, Resource, ResourceType } from "./resources/common/resource";
import { WorkUnitBaseInfoComponent } from "./base-info/work-unit-base-info.component";

class WorkUnitContextError extends Error {}

function workUnitFromDetailRoute(): Observable<WorkUnit | null> {
    const planContext = inject(ExperimentalPlanContext, {skipSelf: true, optional: true});

    const plan$ = planContext ? planContext.plan$ : of(null);

    const models = inject(WorkUnitModelService);
    const activatedRoute = inject(ActivatedRoute);

    return plan$.pipe(
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
    );
}
@Component({
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,

        WorkUnitBaseInfoComponent,
        WorkUnitResourceCardComponent
    ],
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
    `,
    providers: [
        WorkUnitContext,
        ExperimentalPlanContext
    ]
})
export class WorkUnitDetailPage {
    readonly RESOURCE_TYPES = ALL_RESOURCE_TYPES;

    readonly _workUnitContext = inject(WorkUnitContext);
    readonly _workUnitContextConnection: Subscription;
    readonly workUnit$ = this._workUnitContext.workUnit$;

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.connect(workUnitFromDetailRoute());
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