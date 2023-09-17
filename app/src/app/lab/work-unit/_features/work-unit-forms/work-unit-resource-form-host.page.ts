import { Component, Injectable, inject } from "@angular/core";
import { WorkUnit, WorkUnitContext, WorkUnitModelService, WorkUnitPatch, workUnitPatchFromWorkUnit } from "../../work-unit";
import { Subscription, combineLatest, defer, filter, firstValueFrom, map, switchMap } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { WorkUnitFormService } from "../../work-unit-form.service";
import { ExperimentalPlan, ExperimentalPlanContext } from "src/app/lab/experimental-plan/experimental-plan";
import { ResourceContainerFormService } from "../../resource/resource-container-form.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

function workUnitContextFromFormHostRoute() {
    const planContext = inject(ExperimentalPlanContext);
    const plan$ = planContext.plan$.pipe(
        takeUntilDestroyed(),
        filter((plan): plan is ExperimentalPlan => {
            if (plan == null) {
                throw new Error('Cannot access work unit in empty plan context');
            }
            return true;
        })
    );

    const activatedRoute = inject(ActivatedRoute);
    const workUnitIndex$ = activatedRoute.paramMap.pipe(
        map(paramMap => {
            const workUnitIndex = Number.parseInt(paramMap.get('work_unit_index')!)
            if (Number.isNaN(workUnitIndex)) {
                throw new Error('no :work_unit_index in route');
            }
            return workUnitIndex;
        })
    );

    return defer(() => combineLatest([plan$, workUnitIndex$]).pipe(
        map(([plan, workUnitIndex]) => plan.workUnits[workUnitIndex])
    ))
}

@Injectable()
class WorkUnitResourceContainerFormService extends ResourceContainerFormService {
    readonly _workUnitFormService = inject(WorkUnitFormService);

    get form() {
        return this._workUnitFormService.form as any;
    }
}


@Component({
    selector: 'lab-work-unit-resource-form-host-page',
    template: `
        <router-outlet></router-outlet>
    `,
    providers: [
        WorkUnitFormService,
        {
            provide: ResourceContainerFormService,
            useClass: WorkUnitResourceContainerFormService
        }
    ]
})
export class WorkUnitResourceFormHostPage {
    _workUnitContext = inject(WorkUnitContext);
    _workUnitContextConnection: Subscription;

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.sendCommitted(
            workUnitContextFromFormHostRoute()
        );
    }

    ngOnDestroy() {
        this._workUnitContextConnection.unsubscribe();
    }
}
