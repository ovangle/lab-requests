import { CommonModule } from "@angular/common";
import { Component, Injectable, inject } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatTabsModule } from "@angular/material/tabs";
import { RouterModule } from "@angular/router";
import { ExperimentalPlanFormComponent } from "./experimental-plan-form.component";
import { ExperimentalPlan, ExperimentalPlanContext } from "./experimental-plan";
import { Observable, Subscription, of } from "rxjs";
import { Campus } from "src/app/uni/campus/campus";
import { hazardClassFromDivision } from "../work-unit/resources/common/hazardous/hazardous";
import { InputMaterial } from "../work-unit/resources/material/input/input-material";
import { Software } from "../work-unit/resources/software/software";
import { WorkUnit } from "../work-unit/work-unit";
import { MatButtonModule } from "@angular/material/button";
import { FundingModel, GRANT } from "./funding-model/funding-model";


const experimentalPlanFixture = new ExperimentalPlan({
    id: '',
    title: 'The importance of being earnest',
    processSummary: 'Behave earnestly, then deceptively and observe changes.',
    fundingModel: GRANT as FundingModel,
    researcher: 'hello@world.com',
    researcherDiscipline: 'ICT',
    researcherBaseCampus: new Campus({code: 'ROK', name: 'Rockhampton'} as any),
    workUnits: [
       
    ],
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
            committable: {{committable}}
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
    _context: ExperimentalPlanContext = inject(ExperimentalPlanContext);
    _contextSubscription: Subscription;

    constructor() {
        this._context.plan$.subscribe(plan => {
            console.log('context plan', plan)
        });
        this._contextSubscription = this._context.connect(of(experimentalPlanFixture));
    }

    ngOnDestroy() {
        this._contextSubscription.unsubscribe();
    }

}