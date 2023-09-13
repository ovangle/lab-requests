import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { WorkUnitForm } from "../work-unit-form.service";
import { WorkUnitPatch, WorkUnitPatchErrors } from "../work-unit";
import { CampusSearchComponent } from "src/app/uni/campus/campus-search.component";
import { LabTypeSelectComponent } from "../../type/lab-type-select.component";

@Component({
    selector: 'lab-work-unit-base-info-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        CampusSearchComponent,
        LabTypeSelectComponent
    ], 
    template: `
    <form [formGroup]="form">
        <uni-campus-search formControlName="campus" required> 
            <mat-label>Lab Campus</mat-label>

            <mat-error *ngIf="_campusErrors?.required">
                A value is required
            </mat-error>
        </uni-campus-search>

        <app-lab-type-select formControlName="labType">
            <mat-label>Lab type</mat-label>
            <mat-error *ngIf="_labTypeErrors?.required">
                A value is required
            </mat-error>
        </app-lab-type-select>

        <mat-form-field>
            <mat-label>Lab Technician</mat-label>
            <input matInput formControlName="technician">

            <mat-error *ngIf="_technicianErrors?.required">
                A value is required
            </mat-error>
            <mat-error *ngIf="_technicianErrors?.email">
                Invalid email
            </mat-error>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Process summary</mat-label>
            <textarea matInput formControlName="summary">
            </textarea>
        </mat-form-field>
 
        <div class="controls">
            form valid: {{form.valid}}

            <button mat-button 
                    (click)="commit()"
                    [disabled]="!form.valid">
                <mat-icon>keyboard_left</mat-icon>
                Next
            </button>
        </div>
    </form>
    `,
    styles: [`
    :host {
        display: flex;
        flex-direction: column;
    }

    .controls {
        display: flex;
        justify-content: flex-end;
    }
    `],
})
export class WorkUnitBaseInfoFormComponent {
    readonly _controls = [
        'campus',
        'labType', 
        'technician',
        'summary'
    ] as const;

    @Input()
    form: WorkUnitForm;

    @Output()
    requestResest = new EventEmitter<void>();

    @Output()
    requestCommit = new EventEmitter<WorkUnitPatch>();

    get _campusErrors(): WorkUnitPatchErrors['campus'] {
        const campusControl = this.form.controls.campus;
        return campusControl.errors as WorkUnitPatchErrors['campus'] || null;
    }

    get _labTypeErrors(): WorkUnitPatchErrors['labType'] {
        const control = this.form.controls.labType;
        return control.errors as WorkUnitPatchErrors['labType']
    }

    get _technicianErrors(): WorkUnitPatchErrors['technician'] {
        const control = this.form.controls.technician;
        return control.errors as WorkUnitPatchErrors['technician'];
    }

    get startDateErrors(): WorkUnitPatchErrors['startDate'] {
        const control = this.form.controls.startDate;
        return control.errors as WorkUnitPatchErrors['startDate']
    }

    get endDateErrors(): WorkUnitPatchErrors['endDate'] {
        const control = this.form.controls.endDate;
        return control.errors as WorkUnitPatchErrors['endDate'];
    }

    commit() {
        console.log('emmitting commit request');
        this.requestCommit.emit(this.form.value as WorkUnitPatch);
    }

    reset() {
        this.requestResest.emit();
    }
}