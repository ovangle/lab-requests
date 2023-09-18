import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { Subscription, filter, of } from "rxjs";
import { ExperimentalPlan, ExperimentalPlanContext, ExperimentalPlanPatch } from "../experimental-plan";
import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ActivatedRoute, Router } from "@angular/router";
import { ExperimentalPlanFormService } from "../experimental-plan-form.service";


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
        <lab-experimental-plan-form 
            [form]="_formService.form"
            [controls]="controls"
            (requestCommit)="_formService.save()"
            (requestReset)="_formService.reset()">
        </lab-experimental-plan-form>

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
        ExperimentalPlanFormService
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