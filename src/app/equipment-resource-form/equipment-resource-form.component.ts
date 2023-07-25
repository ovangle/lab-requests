import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { AbstractControl, FormControl, FormGroup } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

export class EquipmentResource {
    name: string;
    description: string;
    estimatedCost: number;
    isUniversitySupplied: boolean;
}

export type EquipmentResourceFormGroup = FormGroup<{
    [K in keyof EquipmentResource]: FormControl<EquipmentResource[K]>
}>

export function createEquipmentResourceForm(): EquipmentResourceFormGroup {
    return new FormGroup({
        name: new FormControl<string>('', {nonNullable: true}),
        description: new FormControl<string>('', {nonNullable: true}),
        estimatedCost: new FormControl<number>(0, {nonNullable: true}),
        isUniversitySupplied: new FormControl<boolean>(true, {nonNullable: true})
    });
}

@Component({
    selector: 'lab-req-equipment-form',
    standalone: true,
    imports: [
        CommonModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <div>
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput type="text"
                    id="equipment-{{equipmentIndex}}-name"
                    formControlName="name" />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput
                   id="equipment-{{equipmentIndex}}-description"
                   formControlName="description">
            </textarea>

        </mat-form-field>

        <mat-form-field>
            <mat-label>Supplied by university</mat-label>

            <mat-select id="equipment-{{equipmentIndex}}-is-university-supplied"
                        formControlName="isUniversitySupplied">
                <mat-option [value]="true">Yes</mat-option>
                <mat-option [value]="false">No</mat-option>
            </mat-select>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Estimated cost</mat-label>

            <input matInput type="number"
                   id="equipment-{{equipmentIndex}}-estimated-cost"
                    formControlName="estimatedCost" />
        </mat-form-field>
    </div>
    `
})
export class EquipmentResourceFormComponent {
    @Input()
    get form(): EquipmentResourceFormGroup {
        return this._form;
    }
    set form(value: AbstractControl<any, any>) {
        if (!(value instanceof FormGroup)) {
            throw new Error('Expected a equipment resource form');
        }
        this._form = value;
    }
    private _form: EquipmentResourceFormGroup;

    /**
     * The equipment id.
     */
    @Input()
    get equipmentIndex(): number {
        return this._equipmentIndex;
    }
    set equipmentIndex(value: NumberInput) {
        this._equipmentIndex = coerceNumberProperty(value);
    }
    private _equipmentIndex: number;

}


