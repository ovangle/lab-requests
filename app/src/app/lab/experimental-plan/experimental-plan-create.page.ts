import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ViewChild, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Subscription, of } from "rxjs";
import { ExperimentalPlanContext, ExperimentalPlanPatch } from "./experimental-plan";
import { ExperimentalPlanFormComponent } from "./experimental-plan-form.component";


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
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        ExperimentalPlanFormComponent
    ],
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

    _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);
    _contextConnection: Subscription;

    @ViewChild(ExperimentalPlanFormComponent, {static: true})
    experimentalPlanForm: ExperimentalPlanFormComponent;

    constructor() {
        this._context.plan$.subscribe(plan => {
            console.log('context plan', plan)
        });
        this._contextConnection = this._context.connect(of(null));
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