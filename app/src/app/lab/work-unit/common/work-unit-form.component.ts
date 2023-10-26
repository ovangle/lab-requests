import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { LabTypeSelectComponent } from "../../type/lab-type-select.component";
import { CampusSearchComponent } from "src/app/uni/campus/campus-search.component";
import { WorkUnitForm, WorkUnitFormErrors, workUnitForm, workUnitFormErrors } from "./work-unit-form";
import { WorkUnitDurationFormComponent } from "../duration/work-unit-duration-form.component";
import { coerceArray, coerceStringArray } from "@angular/cdk/coercion";


@Component({
    selector: 'lab-work-unit-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        CampusSearchComponent,
        LabTypeSelectComponent,
        WorkUnitDurationFormComponent
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field *ngIf="isEditableField('name')">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required />

            <mat-error *ngIf="nameErrors?.required">
                A value is required
            </mat-error>
        </mat-form-field>

        <uni-campus-search 
            *ngIf="isEditableField('campus')"
            formControlName="campus" 
            required>
            <mat-label>Campus</mat-label>

            <mat-error *ngIf="campusErrors?.notACampus">
                Expected a campus
            </mat-error>
            <mat-error *ngIf="campusErrors?.required">
                A value is required
            </mat-error>
        </uni-campus-search>

        <lab-type-select 
            *ngIf="isEditableField('labType')"
            formControlName="labType"
            required>
            <mat-label>Lab type</mat-label>
            <mat-error *ngIf="labTypeErrors?.required">
                A value is required
            </mat-error>
        </lab-type-select>

        <mat-form-field *ngIf="isEditableField('technician')">
            <mat-label>technician</mat-label>
            <input matInput formControlName="technician">

            <mat-error *ngIf="technicianErrors?.required">
                A value is required
            </mat-error>
            <mat-error *ngIf="technicianErrors?.email">
                Invalid email
            </mat-error>
        </mat-form-field>

        <mat-form-field *ngIf="isEditableField('processSummary')">
            <mat-label>Process summary</mat-label>
            <textarea matInput formControlName="processSummary">
            </textarea>
        </mat-form-field>

        <lab-work-unit-duration-form [form]="form" />
    </form>
    `
})
export class WorkUnitFormComponent {
    @Input({required: true})
    form: WorkUnitForm;

    @Input()
    fixedFields: string[] | undefined = undefined;

    isEditableField(name: keyof WorkUnitForm['controls']): boolean {
        if (this.fixedFields === undefined) {
            return true;
        }
        return !this.fixedFields.includes(name);
    }

    get nameErrors(): WorkUnitFormErrors['name'] {
        return workUnitFormErrors(this.form, 'name');
    }

    get campusErrors(): WorkUnitFormErrors['campus'] {
        return workUnitFormErrors(this.form, 'campus');
    }

    get labTypeErrors(): WorkUnitFormErrors['labType'] {
        return workUnitFormErrors(this.form, 'labType');
    }

    get technicianErrors(): WorkUnitFormErrors['technician'] {
        return workUnitFormErrors(this.form, 'technician');
    }

    get startDateErrors(): WorkUnitFormErrors['startDate'] {
        return workUnitFormErrors(this.form, 'startDate');
    }
    get endDateErrors(): WorkUnitFormErrors['endDate'] {
        return workUnitFormErrors(this.form, 'endDate')
    }
}