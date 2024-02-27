import { Component, DestroyRef, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CurrencyInputComponent } from 'src/app/common/currency/currency-input.component';
import { MeasurementUnitPipe } from 'src/app/common/measurement/common-measurement-unit.pipe';
import { BooleanInput, NumberInput, coerceBooleanProperty, coerceNumberProperty } from '@angular/cdk/coercion';
import { ResearchFunding } from '../research-funding';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CostEstimate } from './cost-estimate';
import {
  Observable,
  defer,
  filter,
  map,
  startWith,
} from 'rxjs';
import { UnitOfMeasurement } from 'src/app/common/measurement/measurement';
import { MatInputModule } from '@angular/material/input';
import { CostEstimatePipe } from './cost-estimate.pipe';

export type CostEstimateForm = FormGroup<{
  funding: FormControl<ResearchFunding | null>;
  isUniversitySupplied: FormControl<boolean>;
  perUnitCost: FormControl<number>;
  quantityRequired: FormControl<number>;
}>;

export function costEstimateForm(): CostEstimateForm {
  return new FormGroup({
    funding: new FormControl<ResearchFunding | null>(null),
    isUniversitySupplied: new FormControl(true, { nonNullable: true }),
    perUnitCost: new FormControl(0, { nonNullable: true }),
    quantityRequired: new FormControl<number>(1, { nonNullable: true }),
  });
}

export function setCostEstimateFormValue(
  form: CostEstimateForm,
  cost: CostEstimate | null,
) {
  if (cost == null) {
    form.reset();
  } else {
    form.setValue({
      funding: cost.funding,
      isUniversitySupplied: cost.isUniversitySupplied,
      perUnitCost: cost.perUnitCost,
      quantityRequired: cost.quantityRequired,
    });
  }
}

export function costEstimatesFromFormValue(
  value: CostEstimateForm[ 'value' ],
  unit: UnitOfMeasurement | null,
): CostEstimate {
  if (!value.funding) {
    throw new Error('Cost estimate has no funding');
  }


  return {
    funding: value.funding,
    isUniversitySupplied: !!value.isUniversitySupplied,
    perUnitCost: value.perUnitCost!,
    unit: unit || 'item',
    quantityRequired: value.quantityRequired!,
  };
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
  ],
  template: `
    <form [formGroup]="form!">
      <h4><ng-content select=".title"></ng-content></h4>

      @if (canUseExternalFunding) {
        <mat-checkbox formControlName="isUniversitySupplied">
          Include {{ name }} in {{ funding!.name | lowercase }} budget
        </mat-checkbox>
      }

      @if (includeInProjectFunding) {
        @if (!isFixedPerUnitCost) {
          <common-currency-input formControlName="perUnitCost">
            <mat-label>Cost</mat-label>

            @if (unitOfMeasurement) {
              <span matTextSuffix>
                per
                <span
                  [innerHTML]="unitOfMeasurement | commonMeasurementUnit"
                ></span>
              </span>
            }

            @if (perUnitCostErrors) {
              <mat-error>{{perUnitCostErrors | json}}</mat-error>
            }

          </common-currency-input>
        }

        @if (!isFixedQuantityRequired) {
          <mat-form-field>
            <mat-label>Quantity required</mat-label>
            <input matInput type="number" formControlName="quantityRequired" />

            @if (unitOfMeasurement) {
              <span matTextSuffix>
                <span
                  [innerHTML]="unitOfMeasurement | commonMeasurementUnit"
                ></span>
              </span>
            }
          </mat-form-field>
        }

        <div class="total-amount">Total</div>
        @if (totalCost$ | async; as cost) {
          <div>
            <span [innerHTML]="cost | uniCostEstimate: 'full'"></span>
          </div>
        }
      } @else {
        <p>Will be supplied by researcher</p>
      }
    </form>
  `,
})
export class ResearchFundingCostEstimateFormComponent {
  readonly _form = costEstimateForm();

  @Input()
  set form(form: CostEstimateForm) {
    form.valueChanges.subscribe(
      value => this._form.patchValue(value)
    );
  }

  @Input()
  get canUseExternalFunding() {
    return this._canUseExternalFunding;
  }
  set canUseExternalFunding(input: BooleanInput) {
    this._canUseExternalFunding = coerceBooleanProperty(input);
    if (this._canUseExternalFunding) {
      this._form!.patchValue({ isUniversitySupplied: true });
    }
  }
  _canUseExternalFunding = false;

  @Input()
  name: string | undefined;

  @Input()
  get funding(): ResearchFunding | null {
    return this.form.value.funding || null;
  }
  set funding(funding: ResearchFunding | null) {
    this.form!.patchValue({ funding });
  }

  @Input()
  get quantityRequired(): number {
    return this._form!.value.quantityRequired!;
  }
  set quantityRequired(quantityRequired: NumberInput) {
    this._isFixedQuantityRequired = true;
    quantityRequired = coerceNumberProperty(quantityRequired);
    this._form!.patchValue({ quantityRequired });
  }
  _isFixedQuantityRequired = false;
  get isFixedQuantityRequired() {
    return this._isFixedQuantityRequired;
  }

  @Input()
  get perUnitCost(): number {
    return this._form!.value.perUnitCost!;
  }
  set perUnitCost(perUnitCost: NumberInput) {
    this._isFixedPerUnitCost = true;
    perUnitCost = coerceNumberProperty(perUnitCost);
    this._form!.patchValue({ perUnitCost });
  }

  _isFixedPerUnitCost = false;
  get isFixedPerUnitCost() {
    return this._isFixedPerUnitCost;
  }

  @Output()
  readonly costEstimateChange: Observable<CostEstimate> = this._form.valueChanges.pipe(
    filter(() => this._form.valid),
    map((value) => costEstimatesFromFormValue(value, this.unitOfMeasurement))
  )

  get perUnitCostErrors(): ValidationErrors | null {
    if (!this._form!.valid) {
      debugger;
    }
    return this._form!.controls.perUnitCost.errors;
  }

  @Input()
  unitOfMeasurement: UnitOfMeasurement = 'item';
  readonly _destroyRef = inject(DestroyRef);

  readonly totalCost$ = defer(() =>
    this._form!.valueChanges.pipe(
      filter(() => this._form!.valid),
      startWith(this._form!.value),
      map((value) => costEstimatesFromFormValue(value, this.unitOfMeasurement)),
    ),
  );

  get isSuppliedByUni() {
    return this._form!.controls.isUniversitySupplied.value;
  }

  get includeInProjectFunding(): boolean {
    return !!this._form!.value.isUniversitySupplied;
  }

  _totalCost: CostEstimate | undefined;
  get totalCost(): CostEstimate {
    return this._totalCost!;
  }

  ngOnInit() {
    if (this.isFixedPerUnitCost) {
      this._form!.controls[ 'perUnitCost' ].disable();
    }
    if (this.isFixedQuantityRequired) {
      this._form!.controls[ 'quantityRequired' ].disable();
    }
  }
}
