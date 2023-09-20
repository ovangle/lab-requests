import { ChangeDetectorRef, Component, Inject, Injectable, Optional, SkipSelf, ViewChild, inject } from "@angular/core";
import { Subject, Subscription, filter, first, map, of } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanPatch } from "../experimental-plan";
import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ActivatedRoute, Router } from "@angular/router";
import { ExperimentalPlanFormService } from "../experimental-plan-form.service";
import { WorkUnitContext, WorkUnitCreate, WorkUnitModelService } from "../../work-unit/work-unit";


const experimentalPlanCreateFixture: ExperimentalPlanPatch = ({
    title: 'The importance of being earnest',
    processSummary: 'Behave earnestly, then deceptively and observe changes.',
    fundingModel: {
        description: 'Custom funding model',
        requiresSupervisor: false
    },
    researcher: 'hello@world.com',
    researcherDiscipline: 'ICT',
    researcherBaseCampus: 'MEL',
    supervisor: null,
    addWorkUnits: []
});

@Injectable()
export class CreateExperimentalPlanWorkUnitContext extends WorkUnitContext {
    readonly createRequestsSubject = new Subject<WorkUnitCreate>();

    readonly _formService = inject(ExperimentalPlanFormService);

    constructor(
        @Optional() @SkipSelf() @Inject(WorkUnitContext)
        parentContext: WorkUnitContext | undefined
    ) {
        super(parentContext);
        if (parentContext) {
            throw new Error('This context cannot be attached to a parent context');
        }
    }

    override _doCreate(request: WorkUnitCreate) {
        // This doesn't actually create the work unit, it just
        // adds it to the experimental plan form's added work units.
        this.createRequestsSubject.next(request);

        return this.plan$.pipe(
            filter((p): p is ExperimentalPlan => p != null),
            map(plan => plan.workUnits[0]),
            first()
        );
    }
}
@Component({
    selector: 'lab-experimental-plan-create-page',
    template: `
        <lab-experimental-plan-form 
            [form]="_formService.form"
            [controls]="controls"
            (requestCommit)="_formService.save()"
            (requestReset)="_formService.reset()">
        </lab-experimental-plan-form>

        <lab-experimental-plan-create-options-form>
        </lab-experimental-plan-create-options-form>

        <ng-template #controls let-committable="committable" let-commit="doCommit">
            <button mat-raised-button 
                    [disabled]="!committable"
                    (click)="commit()">
                <mat-icon>save</mat-icon>
                NEXT
            </button>
        </ng-template>
    `,
    providers: [
        ExperimentalPlanContext,
        ExperimentalPlanFormService,

        WorkUnitModelService,
        {
            provide: WorkUnitContext,
            useClass: CreateExperimentalPlanWorkUnitContext
        }
    ]
})
export class ExperimentalPlanCreatePage {
    _cdRef = inject(ChangeDetectorRef);

    _router = inject(Router);
    _activatedRoute = inject(ActivatedRoute);

    _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);

    _formService = inject(ExperimentalPlanFormService);

    constructor() {
        this._context.initCreateContext();
        this._context.committed$.pipe(
            filter((committed): committed is ExperimentalPlan => committed != null)
        ).subscribe(committed => {
            console.log('committed');
            this._router.navigate(['../', committed.id], {relativeTo: this._activatedRoute})
        });
    }

    ngAfterViewInit() {
        this._formService.form.setValue({
            ...experimentalPlanCreateFixture,
            addWorkUnits: []
        })
        this._cdRef.detectChanges();
    }
}