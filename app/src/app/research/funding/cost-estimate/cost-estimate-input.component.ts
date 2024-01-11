import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ControlValueAccessor, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  CostEstimateForm,
  costEstimateForm,
} from './cost-estimate-form.component';
import { CostEstimate } from './cost-estimate';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { ResearchFunding } from '../research-funding';
import { NumberInput, coerceNumberProperty } from '@angular/cdk/coercion';
import { MeasurementUnitPipe } from 'src/app/common/measurement/common-measurement-unit.pipe';
import { UnitOfMeasurement } from 'src/app/common/measurement/measurement';
import { CurrencyInputComponent } from 'src/app/common/currency/currency-input.component';

@Component({
  selector: 'uni-cost-estimate-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,

    CurrencyInputComponent,
    MeasurementUnitPipe,
  ],
  template: `
    <ng-container [formGroup]="_form">
      <mat-form-field>
        <mat-label>Quantity</mat-label>
        <input matInput formControlName="quantityRequired" />
      </mat-form-field>

      <span class="spacer"></span>

      <common-currency-input formControlName="perUnitCost">
        <mat-label>Cost</mat-label>
        <div class="input-text-suffix">
          per
          <span [innerHTML]="unitOfMeasurement | commonMeasurementUnit"></span>
        </div>
      </common-currency-input>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: flex;
      }
      mat-form-field {
        flex-grow: 1;
      }

      .spacer {
        padding: 0em 0.5em;
        height: 56px;
        line-height: 56px;
      }

      .input-text-suffix {
        white-space: nowrap;
      }
    `,
  ],
})
export class CostEstimateInputComponent implements ControlValueAccessor {
  _form: CostEstimateForm = costEstimateForm();

  @Input({ required: true })
  fundingModel: ResearchFunding;

  @Input({ required: true })
  unitOfMeasurement: UnitOfMeasurement;

  @Input()
  get perUnitCost() {
    return this._form.value.perUnitCost!;
  }
  set perUnitCost(value: NumberInput) {
    this._isFixedPerUnitCost = true;
    this._form.patchValue({ perUnitCost: coerceNumberProperty(value) });
  }
  get isFixedPerUnitCost(): boolean {
    return this._isFixedPerUnitCost;
  }
  _isFixedPerUnitCost = false;

  @Input()
  get quantityRequired(): number {
    return this._form.value.quantityRequired!;
  }
  set quantityRequired(value: NumberInput) {
    this._isFixedQuantityRequired = true;
    this._form.patchValue({ quantityRequired: coerceNumberProperty(value) });
  }
  get isFixedQuantityRequired(): boolean {
    return this._isFixedQuantityRequired;
  }
  _isFixedQuantityRequired = false;

  ngOnInit() {
    if (this._isFixedPerUnitCost) {
      this._form.controls.perUnitCost.disable();
    }
    if (this._isFixedQuantityRequired) {
      this._form.controls.quantityRequired.disable();
    }
  }

  writeValue(obj: CostEstimate | null): void {
    if (obj == null) {
      return this._form.reset();
    }
    return this._form.setValue(obj);
  }
  _onChange = (value: CostEstimate | null) => {};
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => {};
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean) {
    if (isDisabled && !this._form.disabled) {
      this._form.disable();
    }
    if (!isDisabled && !this._form.disabled) {
      this._form.enable();
      if (this._isFixedPerUnitCost) {
        this._form.controls['perUnitCost'].disable();
      }
      if (this._isFixedQuantityRequired) {
        this._form.controls['quantityRequired'].disable();
      }
    }
  }
}
