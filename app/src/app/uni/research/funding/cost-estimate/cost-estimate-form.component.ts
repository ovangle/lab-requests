import { Component, Input } from "@angular/core";
import { CostEstimateForm, costEstimateForm } from './cost-estimate-form';
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";


@Component({
    selector: 'uni-research-funding-cost-estimate-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Supplied by</mat-label>
            <mat-select>
                <mat-option [value]="false">Researcher</mat-option>
                <mat-option [value]="true">Uni</mat-option>
            </mat-select>
        </mat-form-field>

        <mat-form-field *ngIf="isSuppliedByUni">
            <mat-label>Estimated cost</mat-label>
            <input matInput type="number" formControlName="estimatedCost" />
            <mat-hint>Leave blank if unknown</mat-hint>
        </mat-form-field>
    </form>
    `
})
export class CostEstimateFormComponent {
    form = costEstimateForm();

    get isSuppliedByUni() {
        return this.form.controls.isUniversitySupplied.value;
    }
}