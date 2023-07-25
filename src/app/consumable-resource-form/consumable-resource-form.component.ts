import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";


export interface ConsumableResource {
    name: string;
    /**
     * The amount of the consumable which is purchased when one unit is purchased
     */
    purchasingUnit: string;

    /**
     * The cost to purchase one unit of the consumable resource.
     */
    estimatedCostPerUnit: number;

    /**
     * Should the consumable be purchased by the university
     */
    isUniversitySupplied: boolean;
}

export type ConsumableResourceForm = FormGroup<{
    [K in keyof ConsumableResource]: FormControl<ConsumableResource[K]>
}>;

export function createConsumableResourceForm(): ConsumableResourceForm {
    return new FormGroup({
        name: new FormControl('', {nonNullable: true}),
        purchasingUnit: new FormControl('', {nonNullable: true}),
        estimatedCostPerUnit: new FormControl(0, {nonNullable: true}),
        isUniversitySupplied: new FormControl(true, {nonNullable: true})
    });

}

@Component({
    selector: 'lab-req-consumable-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatInputModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <div [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput id="consumable-{{consumableIndex}}-name" />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Purchasing unit</mat-label>
            <input matInput id="consumable-{{consumableIndex}}-purchasing-unit" />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Estimated unit cost </mat-label>
            <input matInput id="consumable-{{consumableIndex}}-estimated-unit-cost" />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Supplied by university</mat-label>
            <mat-select>
                <mat-option [value]="true">Yes</mat-option>
                <mat-option [value]="false">No</mat-option>
            </mat-select>
        </mat-form-field>
    </div>
    `
})
export class ConsumableResourceFormComponent {
    @Input()
    get form(): ConsumableResourceForm {
        return this._form;
    }
    set form(value: AbstractControl<any, any>) {
        if (!(value instanceof FormGroup)) {
            throw new Error('Expected a consumable resource form');
        }
        this._form = value;
    }
    private _form: ConsumableResourceForm;

    @Input()
    get consumableIndex(): number {
        return this._consumableIndex;
    }
    set consumableIndex(value: NumberInput) {
        this._consumableIndex = coerceNumberProperty(value);
    }
    private _consumableIndex: number;

}