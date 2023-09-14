import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { Subscription, filter, of } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanPatch } from "../experimental-plan";
import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ActivatedRoute, Router } from "@angular/router";


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

@Component({
    selector: 'lab-experimental-plan-create-page',
    template: `
        <lab-experimental-plan-form [controls]="controls"></lab-experimental-plan-form>

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
    ]
})
export class ExperimentalPlanCreatePage {
    _cdRef = inject(ChangeDetectorRef);

    _router = inject(Router);
    _activatedRoute = inject(ActivatedRoute);

    _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);
    _contextConnection: Subscription;

    @ViewChild(ExperimentalPlanFormComponent, {static: true})
    experimentalPlanForm: ExperimentalPlanFormComponent;

    constructor() {
        this._context.committed$.pipe(
            filter((committed): committed is ExperimentalPlan => committed != null)
        ).subscribe(committed => {
            console.log('committed');
            this._router.navigate(['../', committed.id], {relativeTo: this._activatedRoute})
        });
    }

    ngAfterViewInit() {
        this.experimentalPlanForm.form.setValue({
            ...experimentalPlanCreateFixture,
            addWorkUnits: []
        })
        this._cdRef.detectChanges();
    }

    ngOnDestroy() {
        this._contextConnection.unsubscribe();
    }
}