import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CurrencyInputComponent } from "src/app/common/currency/currency-input.component";
import { CommonMeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { FundingModel } from "../funding-model";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { CostEstimate } from "./coste-estimate";

export type CostEstimateForm = FormGroup<{
    isUniversitySupplied: FormControl<boolean>;
    estimatedCost: FormControl<number>;
}>;

export function costEstimateForm(): CostEstimateForm {
    return new FormGroup({
        isUniversitySupplied: new FormControl(true, {nonNullable: true}),
        estimatedCost: new FormControl(0, {nonNullable: true}),
    });
}

export function costEstimatesFromFormValue(form: CostEstimateForm): CostEstimate {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    return {
        isUniversitySupplied: !!form.value.isUniversitySupplied,
        estimatedCost: form.value.estimatedCost!
    };
}

@Component({
    selector: 'uni-research-funding-cost-estimate-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,

        CommonMeasurementUnitPipe,
        CurrencyInputComponent
    ],
    template: `
    <form [formGroup]="form">
        <h4>Funding</h4>

        <mat-checkbox formControlName="isUniversitySupplied">
            Include in project budget
        </mat-checkbox>

        <ng-container [ngSwitch]="includeInProjectFunding">
            <ng-container *ngSwitchCase="true">
                <common-currency-input
                    formControlName="estimatedCost">

                    <mat-label>Cost</mat-label>
                    <span *ngIf="unitOfMeasurement" matTextSuffix>
                        per <span [innerHTML]="unitOfMeasurement | commonMeasurementUnit"></span> 
                    </span>
                </common-currency-input>

                <div *ngIf="unitOfMeasurement"> 
                    <dl class="total-amount">
                        <dl>Total (for <span [innerHTML]="unitOfMeasurement | commonMeasurementUnit"></span></dl>
                        <dd>{{estimatedTotalCost}}</dd>
                    </dl>
                </div>
            </ng-container>
            <div *ngSwitchCase="false">
                <p>Will be supplied by researcher</p>
            </div>
        </ng-container>
      
    </form>
    `
})
export class CostEstimateFormComponent {
    @Input()
    form: CostEstimateForm;

    @Input()
    funding: FundingModel;

    @Input()
    unitOfMeasurement: string | null;

    @Input()
    get quantityRequired(): number {
        return this._quantityRequired;
    }
    set quantityRequired(amount: NumberInput) {
        this._quantityRequired = coerceNumberProperty(amount);
    }
    _quantityRequired: number = 1;

    get isSuppliedByUni() {
        return this.form.controls.isUniversitySupplied.value;
    }

    get includeInProjectFunding(): boolean {
        return !!this.form.value.isUniversitySupplied;
    }

    get estimatedTotalCost() {
        const estimatedCost = this.form.value.estimatedCost || 0;
        return this._quantityRequired * estimatedCost;
    }
}