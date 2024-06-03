import { Component, DestroyRef, EventEmitter, Input, Output, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CurrencyInputComponent } from 'src/app/common/currency/currency-input.component';
import { MeasurementUnitPipe } from 'src/app/common/measurement/common-measurement-unit.pipe';
import { BooleanInput, NumberInput, coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { ResearchFunding } from '../research-funding';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CostEstimate } from './cost-estimate';
import {
  Observable,
  combineLatest,
  defer,
  filter,
  map,
  shareReplay,
  startWith,
} from 'rxjs';
import { UnitOfMeasurement } from 'src/app/common/measurement/measurement';
import { MatInputModule } from '@angular/material/input';
import { CostEstimatePipe } from './cost-estimate.pipe';
import { ResearchFundingSelectComponent } from '../research-funding-select.component';
import { modelId } from 'src/app/common/model/model';
import { toObservable } from '@angular/core/rxjs-interop';

export type CostEstimateFormGroup = FormGroup<{
  funding: FormControl<ResearchFunding | null>;
  perUnitCost: FormControl<number>
}>;

export function costEstimateFormGroup(
  defaultFunding: ResearchFunding | null | undefined
): CostEstimateFormGroup {
  return new FormGroup({
    funding: new FormControl<ResearchFunding | null>(defaultFunding || null),
    perUnitCost: new FormControl(0, { nonNullable: true })
  });
}

export function costEstimateFromFormValue(
  value: CostEstimateFormGroup['value'],
  context: {
    quantityRequired: [number, UnitOfMeasurement]
  }
): CostEstimate {
  const [numRequired, unit] = context.quantityRequired;
  return {
    funding: value.funding!,
    perUnitCost: value.perUnitCost!,
    numRequired,
    unit
  };
}

export function isCostEstimateFormGroup(obj: unknown): obj is CostEstimateFormGroup {
  return obj instanceof FormGroup;
}

@Component({
  selector: 'research-funding-cost-estimate-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,

    MeasurementUnitPipe,
    CurrencyInputComponent,
    CostEstimatePipe,

    ResearchFundingSelectComponent
  ],
  template: `
    <form [formGroup]="_form">
      <h4><ng-content select=".title"></ng-content></h4>

      <research-funding-select formControlName="funding" />

      @if (!isProjectFundingSelected) {
        <div class="warning-text">
          This cost will not be included in the current plan
          funding.
        </div>
      }

      <common-currency-input formControlName="perUnitCost">
        <mat-label>Cost</mat-label>

        <span matTextSuffix>
          per 
          <span [innerHTML]="unitOfMeasurement() | commonMeasurementUnit"></span>
        </span>

        @if (perUnitCostErrors) {
          <mat-error>{{perUnitCostErrors | json}}</mat-error>
        }
      </common-currency-input>

      <div>
        <div class="total-amount">Total</div>
        <div>
          <span [innerHTML]="(value || null) | uniCostEstimate: 'full'"></span>
        </div>
      </div>
   </form>
  `,
})
export class ResearchFundingCostEstimateFormComponent {
  _controlContainer = inject(ControlContainer, { optional: true });

  get _form(): CostEstimateFormGroup {
    if (isCostEstimateFormGroup(this._controlContainer?.control)) {
      return this._controlContainer?.control;
    }
    throw new Error('cost-estimate form cannot be standalone')
  }

  funding = input<ResearchFunding>();
  quantityRequired = input<[number, string]>([1, 'item']);

  numRequired = computed(() => this.quantityRequired()[0]);
  unitOfMeasurement = computed(() => this.quantityRequired()[1]);

  totalCost$ = combineLatest([
    toObservable(this.quantityRequired),
    this._form.valueChanges.pipe(
      filter(() => this._form.valid),
      map(value => value.perUnitCost!),
      startWith(0)
    )
  ]).pipe(
    map(([[numRequired, unitOfMeasurement], perUnitCost]) => {
      return [numRequired * perUnitCost, unitOfMeasurement] as [number, string];
    })
  )
  totalCost = computed(() => {
    const [numRequired, unitOfMeasurement] = this.quantityRequired();
    const perUnitCost = this._form.value.perUnitCost!;
    return [perUnitCost * numRequired, unitOfMeasurement]
  });

  save = new EventEmitter<CostEstimate>();

  get value(): CostEstimate | undefined {
    if (!this._form.valid) {
      return undefined;
    }

    return costEstimateFromFormValue(
      this._form.value,
      { quantityRequired: this.quantityRequired() }
    );
  }

  get isProjectFundingSelected() {
    const selectedFunding = this._form.value.funding;
    return modelId(selectedFunding) === modelId(this.funding());
  }

  get perUnitCostErrors(): ValidationErrors | null {
    if (!this._form!.valid) {
      debugger;
    }
    return this._form!.controls.perUnitCost.errors;
  }
}
