import { ChangeDetectorRef, Component, Inject, Injectable, Optional, SkipSelf, ViewChild, inject } from "@angular/core";
import { Subject, Subscription, filter, first, firstValueFrom, map, of } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanPatch } from "../experimental-plan";
import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ActivatedRoute, Router } from "@angular/router";
import { WorkUnitContext, WorkUnitCreate, WorkUnitModelService } from "../../work-unit/work-unit";
import { experimentalPlanForm, experimentalPlanPatchFromForm } from "../experimental-plan-form";


const experimentalPlanCreateFixture: Partial<ExperimentalPlanPatch> = {
    title: 'The importance of being earnest',
    processSummary: 'Behave earnestly, then deceptively and observe changes.',
    fundingModel: 'Grant',
    researcher: 'a@researcher',
    researcherDiscipline: 'ICT',
    researcherBaseCampus: 'MEL',
    supervisor: null,
    addWorkUnits: []
};

@Injectable()
export class CreateExperimentalPlanWorkUnitContext extends WorkUnitContext {
    readonly createRequestsSubject = new Subject<WorkUnitCreate>();

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
        <h1>Create experimental plan</h1>

        <lab-experimental-plan-form [form]="form">
            <div class="form-controls" (mouseenter)="_showAllFormErrors()">
                <button mat-raised-button 
                        [disabled]="form.invalid" 
                        (mouseover)="_showAllFormErrors()"
                        (click)="save(); $event.stopPropagation()">
                    <mat-icon>save</mat-icon> SAVE
                </button>
            </div>
        </lab-experimental-plan-form>
    `,
    styles: [`
    .form-controls {
        display: flex;
        justify-content: right;
    }
    `],
    providers: [
        ExperimentalPlanContext,
        {
            provide: WorkUnitContext,
            useClass: CreateExperimentalPlanWorkUnitContext
        }
    ]
})
export class ExperimentalPlanCreatePage {
    readonly _cdRef = inject(ChangeDetectorRef);

    readonly _router = inject(Router);
    readonly _activatedRoute = inject(ActivatedRoute);

    readonly _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);

    readonly form = experimentalPlanForm();
    readonly patch$ = experimentalPlanPatchFromForm(this.form);

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
        this.form.patchValue({
            ...experimentalPlanCreateFixture,
            addWorkUnits: []
        })
        this._cdRef.detectChanges();
    }

    async save() {
        if (!this.form.valid) {
            throw new Error('Cannot save invalid form');
        }
        console.log('saving...');
        debugger;
        const patch = await firstValueFrom(this.patch$);
        console.log('patch', patch);
        return this._context.save(patch);
    }

    _showAllFormErrors() {
        console.log('show all form errors', this.form.errors);
        this.form.markAllAsTouched();
    }
}