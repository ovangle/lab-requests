import { CommonModule } from "@angular/common";
import { Component, computed, inject, input } from "@angular/core";
import { ControlContainer, FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CurrencyInputComponent } from "src/app/common/currency/currency-input.component";
import { CreatePurchaseOrder, ResearchBudget } from "./research-budget";
import { UnitOfMeasurement } from "src/app/common/measurement/measurement";
import { MeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { TextFieldModule } from "@angular/cdk/text-field";



export function researchPurchaseOrderFormGroupFactory() {
    const fb = inject(FormBuilder);

    return () => fb.group({
        estimatedCost: fb.control<number>(0, { nonNullable: true }),
        purchaseUrl: fb.control<string>('', { nonNullable: true }),
        note: fb.control<string>('', { nonNullable: true })

    });
}

export type ResearchPurchaseOrderFormGroup = ReturnType<ReturnType<typeof researchPurchaseOrderFormGroupFactory>>;

export function purchaseOrderRequestFromFormValue(
    budget: ResearchBudget | string,
    purchaseOrderType: string,
    value: ResearchPurchaseOrderFormGroup['value']
): CreatePurchaseOrder {
    return {
        type: purchaseOrderType,
        budget,
        estimatedCost: value.estimatedCost!,
        purchaseUrl: value.purchaseUrl!,
        note: value.note!
    };

}

@Component({
    selector: 'research-purchase-order-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        TextFieldModule,

        MatFormFieldModule,
        MatInputModule,

        CurrencyInputComponent,
        MeasurementUnitPipe
    ],
    template: `
    <form [formGroup]="form">
        <ng-content></ng-content>

        <mat-form-field>
            <mat-label>Estimated cost</mat-label>
            <common-currency-input formControlName="estimatedCost" />
            <span matPrefix>$</span>

            @if (isPerUnitCost()) {
                <span matSuffix>
                    per {{unitOfMeasurement() | commonMeasurementUnit}}
                </span>
            }

            @if (isPerUnitCost()) {
                <mat-hint>
                    Total: {{totalCost() | currency}}
                </mat-hint>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Purchase info url</mat-label>
            <input matInput type="text" />
            <mat-hint>Optional information about the quoted cost</mat-hint>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Additional instructions</mat-label>
            <textarea matInput formGroupName="note"
                      cdkTextareaAutosize></textarea>
        </mat-form-field>
    </form>
    `
})
export class ResearchPurchaseOrderFormComponent {
    controlContainer = inject(ControlContainer, { self: true });

    budget = input<ResearchBudget | null>(null);
    unitOfMeasurement = input<UnitOfMeasurement>('');

    numUnitsRequired = input<number>(1);
    isPerUnitCost = computed(() => this.unitOfMeasurement() !== '');

    totalCost = computed(() => {
        return this.numUnitsRequired() * this.form.value.estimatedCost!;
    })


    get form(): ResearchPurchaseOrderFormGroup {
        return this.controlContainer.control as ResearchPurchaseOrderFormGroup;
    }
}