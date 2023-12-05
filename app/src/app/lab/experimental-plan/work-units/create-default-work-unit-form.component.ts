import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormArray, FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { Subscription, distinctUntilChanged, startWith } from "rxjs";
import { MatCardModule } from "@angular/material/card";
import { WorkUnitForm, workUnitForm } from "../../work-unit/common/work-unit-form";
import { ExperimentalPlanForm } from "../common/experimental-plan-form";
import { WorkUnitPatch } from "../../work-unit/common/work-unit";
import { WorkUnitFormComponent } from "../../work-unit/common/work-unit-form.component";


@Component({
    selector: 'lab-experimental-plan-create-default-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatCheckboxModule,
        WorkUnitFormComponent
    ],
    template: `
    <mat-checkbox [formControl]="addDefaultWorkUnitControl"> 
        Also create a work unit for the appropriate lab using 
        the researcher's base campus and discipline
    </mat-checkbox>

    @if (isAddingWorkUnit) {
        <mat-card>
            <mat-card-header>
                <h3>Work Unit</h3>
            </mat-card-header>
            <mat-card-content>
                <lab-work-unit-form [form]="workUnitForm" />
            </mat-card-content>
        </mat-card>
        
    }
    `,
})
export class ExperimentalPlanCreateDefaultWorkUnitForm {
    @Input({ required: true })
    form: ExperimentalPlanForm;
    _prefillFormSubscription: Subscription | undefined;
    _syncDefaultWorkUnitSubscription: Subscription | undefined;

    get _addWorkUnitsArray(): FormArray<WorkUnitForm> {
        return this.form.controls['addWorkUnits'];
    }

    @Output()
    requestCommit = new EventEmitter<WorkUnitPatch>();

    readonly addDefaultWorkUnitControl = new FormControl<boolean>(true, { nonNullable: true });

    get isAddingWorkUnit() {
        return this.addDefaultWorkUnitControl.value;
    }
    readonly workUnitForm = workUnitForm();

    ngOnInit() {
        this._prefillFormSubscription = this.form.valueChanges.pipe(
            distinctUntilChanged((curr, next) => {
                return curr.researcherBaseCampus === next.researcherBaseCampus 
                    && curr.researcherDiscipline === next.researcherDiscipline;
            })
        ).subscribe(({ researcherBaseCampus, researcherDiscipline }) => {
            this.workUnitForm.patchValue({
                campus: researcherBaseCampus,
                labType: researcherDiscipline
            });
        })

        this._syncDefaultWorkUnitSubscription = this.addDefaultWorkUnitControl.valueChanges.pipe(
            startWith(this.addDefaultWorkUnitControl.value),
            distinctUntilChanged()
        ).subscribe(isAddingWorkUnit => {
            if (isAddingWorkUnit && this._addWorkUnitsArray.length === 0) {
                this.form.controls.addWorkUnits.push(this.workUnitForm);
            }
            while (!isAddingWorkUnit && this._addWorkUnitsArray.length > 0) {
                this._addWorkUnitsArray.removeAt(0);
            }
        })
    }

    ngOnDestroy() {
        this._prefillFormSubscription?.unsubscribe();
        this._syncDefaultWorkUnitSubscription?.unsubscribe();
    }
}