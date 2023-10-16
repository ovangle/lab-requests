import { AfterViewInit, Component, Injectable, OnDestroy, inject } from "@angular/core";
import { Subscription, combineLatest, defer, filter, firstValueFrom, map, switchMap } from "rxjs";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { ResourceContainerForm, ResourceContainerFormService } from "../../resource/resource-container-form.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { WorkUnitForm, workUnitForm } from "../../common/work-unit-form";
import { BodyScrollbarHidingService } from "src/app/utils/body-scrollbar-hiding.service";
import { ExperimentalPlanContext, ExperimentalPlan } from "src/app/lab/experimental-plan/common/experimental-plan";
import { WorkUnitContext, WorkUnit, workUnitPatchFromWorkUnit } from "../../common/work-unit";

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
    readonly _formHost = inject(WorkUnitResourceFormHostPage);

    get form(): ResourceContainerForm {
        return this._formHost.form as any;
    }
}


@Component({
    selector: 'lab-work-unit-resource-form-host-page',
    template: `
    <router-outlet></router-outlet>
    `,
    host: {
        'class': 'mat-elevation-z8'
    },
    styleUrls: [
        './work-unit-form.css'
    ],
    providers: [
        {
            provide: ResourceContainerFormService,
            useClass: WorkUnitResourceContainerFormService
        }
    ]
})
export class WorkUnitResourceFormHostPage implements AfterViewInit, OnDestroy {
    _workUnitContext = inject(WorkUnitContext);
    _workUnitContextConnection: Subscription;

    _activatedRoute: ActivatedRoute;

    readonly form = workUnitForm();
    readonly appScaffold = inject(BodyScrollbarHidingService);

    constructor() {
        this._workUnitContextConnection = this._workUnitContext.sendCommitted(
            workUnitContextFromFormHostRoute()
        );
        this._workUnitContext.committed$.pipe(
            filter((workUnit): workUnit is WorkUnit => workUnit != null),
            map(workUnitPatchFromWorkUnit)
        ).subscribe(patch => {
            this.form.patchValue(patch);
        });
    }
    ngAfterViewInit() {
        this.appScaffold.hideScrollbar();
    }

    ngOnDestroy() {
        this._workUnitContextConnection.unsubscribe();
        this.appScaffold.unhideScrollbar();
    }
}
