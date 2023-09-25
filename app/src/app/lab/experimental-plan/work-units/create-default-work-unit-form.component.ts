import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { FormArray, FormControl, ReactiveFormsModule } from "@angular/forms";
import { WorkUnitContext, WorkUnitPatch } from "../../work-unit/work-unit";
import { CommonModule } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { WorkUnitForm, workUnitForm, workUnitPatchFromForm } from "../../work-unit/work-unit-form";
import { WorkUnitBaseInfoFormComponent } from "../../work-unit/base-info/work-unit-base-info-form.component";
import { ExperimentalPlanForm } from "../experimental-plan-form";
import { ExperimentalPlanCreate } from "../experimental-plan";
import { Subscription, combineLatest, distinctUntilChanged, distinctUntilKeyChanged, filter, map, startWith, takeUntil } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MatCardModule } from "@angular/material/card";


@Component({
    selector: 'lab-experimental-plan-create-default-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatCheckboxModule,
        WorkUnitBaseInfoFormComponent
    ],
    template: `
    <mat-checkbox [formControl]="addDefaultWorkUnitControl"> 
        Also create a work unit for the appropriate lab using 
        the researcher's base campus and discipline
    </mat-checkbox>

    <ng-container *ngIf="isAddingWorkUnit">
        <mat-card>
            <mat-card-header>
                <h3>Work Unit</h3>
            </mat-card-header>
            <mat-card-content>
                <lab-work-unit-base-info-form 
                    [form]="workUnitForm">
                </lab-work-unit-base-info-form>
            </mat-card-content>
        </mat-card>
        
    </ng-container>
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