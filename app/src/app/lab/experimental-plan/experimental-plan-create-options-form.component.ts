import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { WorkUnitContext, WorkUnitCreate } from "../work-unit/work-unit";
import { WorkUnitForm, WorkUnitFormService } from "../work-unit/work-unit-form.service";
import { WorkUnitBaseInfoFormComponent } from "../work-unit/base-info/work-unit-base-info-form.component";
import { Subject, filter, first, map } from "rxjs";
import { ExperimentalPlan } from "./experimental-plan";

interface ExperimentalPlanCreateOptions {
    addWorkUnitForResearcher: boolean;
    addWorkUnits: []
}

@Component({
    selector: 'lab-experimental-plan-create-options-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        WorkUnitBaseInfoFormComponent
    ],
    template: `
        <mat-checkbox [formControl]="addWorkUnitForResearcher"> 
            Also create a work unit for the appropriate lab using 
            the researcher's base campus and discipline
        </mat-checkbox>

        <ng-container *ngIf="isAddingWorkUnit">
            <lab-work-unit-base-info-form 
                [form]="_formService.form"
            >
            </lab-work-unit-base-info-form>
        </ng-container>
    `,
    providers: [
        WorkUnitFormService
    ]
})
export class ExperimentalPlanCreateOptionsFormComponent {
    readonly addWorkUnitForResearcher = new FormControl(true, {nonNullable: true})

    get isAddingWorkUnit() {
        return this.addWorkUnitForResearcher.value;
    }

    readonly _formService = inject(WorkUnitFormService);
}