import { Component, computed, effect, input } from "@angular/core";
import { ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
import { UnitOfMeasurement } from "./measurement";
import { isQuantity } from "./common-quantity.component";
import { MatInput } from "@angular/material/input";
import { MeasurementUnitPipe } from "./common-measurement-unit.pipe";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { CommonMeasurementUnitInputComponent } from "./common-measurement-unit-input.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";



@Component({
    selector: 'common-quantity-input',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatInput,

        MeasurementUnitPipe,
        CommonMeasurementUnitInputComponent
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="#controlLabel" /></mat-label>

        <input matInput type="number" 
               formControlName="amount" 
               [required]="required()" 
               (blur)="_onTouched()" />

        @if (isFixedUnit()) {
            <span matTextSuffix>
                {{ unit()! | commonMeasurementUnit: 2 }}
            </span>
        }

        <mat-error>
            <ng-content select="controlErrors" />
        </mat-error>
    </mat-form-field>

    @if (!isFixedUnit()) {
        <common-measurement-unit-input 
            formControlName="unit" 
            [required]="required()" />
    }
    `,
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: QauntityInputComponent }
    ]
})
export class QauntityInputComponent implements ControlValueAccessor {
    unit = input<UnitOfMeasurement>();
    required = input(false, { transform: coerceBooleanProperty });

    isFixedUnit = computed(() => this.unit() !== undefined);

    _form = new FormGroup({
        amount: new FormControl<number>(0, { nonNullable: true }),
        unit: new FormControl<UnitOfMeasurement | null>(null)
    });

    constructor() {
        effect(() => {
            this._form.patchValue({ unit: this.unit() || null }, { emitEvent: false });
        })

        this._form.valueChanges.pipe(
            takeUntilDestroyed()
        ).subscribe((value) => {
            this._onChange([ value.amount!, value.unit! ]);
        })
    }

    writeValue(obj: any): void {
        const fixedUnit = this.unit();
        if (!isQuantity(obj)) {
            throw new Error('Expected a quantity');
        }
        const [ amount, unit ] = obj;
        if (fixedUnit && unit !== fixedUnit) {
            throw new Error('Unit is fixed for this quantity input');
        }
        this._form.setValue({ amount, unit });
    }
    _onChange = (value: any) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { }
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this._form);
}