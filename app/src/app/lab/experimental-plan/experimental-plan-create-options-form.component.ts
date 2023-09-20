import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { WorkUnitContext, WorkUnitCreate } from "../work-unit/work-unit";
import { WorkUnitFormService } from "../work-unit/work-unit-form.service";
import { WorkUnitBaseInfoFormComponent } from "../work-unit/base-info/work-unit-base-info-form.component";
import { Subject } from "rxjs";

interface ExperimentalPlanCreateOptions {
    addWorkUnitForResearcher: boolean;
    addWorkUnits: []
}

export class WorkUnitCreateContext extends WorkUnitContext {
    readonly createRequestsSubject = new Subject<WorkUnitCreate>();

    override _doCreate(request: WorkUnitCreate) {
        // This doesn't actually create the work unit, it just
        // adds it to the experimental plan form's added work units.
        this.createRequestsSubject.next(request);
    }

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
        <mat-checkbox formControlName="addWorkUnitForResearcher"> 
            Also create a work unit for the appropriate lab using 
            the researcher's base campus and discipline
        </mat-checkbox>

        <lab-work-unit-base-info-form 
            [form]="_formService.form">
    `,
    providers: [
        WorkUnitContext,
        WorkUnitFormService
    ]
})
export class ExperimentalPlanCreateOptionsFormComponent {
    readonly addWorkUnitForResearcher = new FormControl(true, {nonNullable: true})
    _context = inject(WorkUnitContext);

    contructor() {
        this._context.initCreateContext();
    }
}