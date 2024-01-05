import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanInput } from '@angular/cdk/coercion';
import { equipmentRequestForm } from './equipment-request-form';
import { EquipmentRequest } from './equipment-request';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { CostEstimateFormComponent } from 'src/app/uni/research/funding/cost-estimate/cost-estimate-form.component';
import { FundingModel } from 'src/app/uni/research/funding/funding-model';

@Component({
  selector: 'lab-equipment-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,

    ResizeTextareaOnInputDirective,
    CostEstimateFormComponent,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Reason to purchase</mat-label>
        <textarea matInput formControlName="reason" resizeOnInput> </textarea>
      </mat-form-field>

      <uni-research-funding-cost-estimate-form
        [form]="form.controls.cost"
        name="purchase"
        [funding]="purchaseFundingModel"
        unitOfMeasurement="unit"
      >
      </uni-research-funding-cost-estimate-form>
    </form>
  `,
})
export class EquipmentRequestFormComponent {
  readonly form = equipmentRequestForm();

  @Input({ required: true })
  purchaseFundingModel: FundingModel;

  @Output()
  equipmentRequestChange = new EventEmitter<EquipmentRequest>();

  constructor() {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.form.valid),
      )
      .subscribe((value) =>
        this.equipmentRequestChange.emit(value as EquipmentRequest),
      );
  }

  // Allow binding to name in order to pre-populate the field.
  @Input()
  get name() {
    return this.form.value.name || '';
  }
  set name(value: string | null) {
    this.form.patchValue({ name: value || '' });
  }

  @Input()
  get disabled() {
    return this.form.disabled;
  }
  set disabled(isDisabled: BooleanInput) {
    if (isDisabled && !this.form.disabled) {
      this.form.disable();
    }
    if (!isDisabled && this.form.disabled) {
      this.form.enable();
    }
  }
}
