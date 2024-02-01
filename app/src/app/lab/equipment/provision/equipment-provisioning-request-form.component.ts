import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanInput } from '@angular/cdk/coercion';
import { LabEquipmentProvision, LabEquipmentProvisionRequest } from './lab-equipment-provision';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { CostEstimateForm, CostEstimateFormComponent, costEstimateForm, costEstimatesFromForm, setCostEstimateFormValue } from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { Equipment, LabEquipmentCreateRequest } from '../equipment';
import { EquipmentRequest } from '../request/equipment-request';
import { Lab } from '../../lab';

export type EquipmentRequestForm = FormGroup<{
  /**
   * Either an equipment, or the name of an equipment to create
   */
  equipment: FormControl<Equipment | string>;
  reason: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  cost: CostEstimateForm;
  purchaseUrl: FormControl<string>;
}>;

export function equipmentRequestForm(
  equipmentName?: string,
): EquipmentRequestForm {
  return new FormGroup({
    equipment: new FormControl<Equipment | string>(
      equipmentName || '', { nonNullable: true }
    ),
    reason: new FormControl<string>('', {
      nonNullable: true,
    }),
    hasCostEstimates: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    cost: costEstimateForm(),
    purchaseUrl: new FormControl('', { nonNullable: true })
  });
}

export function equipmentRequestFromForm(
  lab: Lab | null,
  form: EquipmentRequestForm,
  funding: ResearchFunding | null
): LabEquipmentProvisionRequest {
  if (!form.valid) {
    throw new Error('Invalid form has no value');
  }
  let equipment: Equipment | LabEquipmentCreateRequest;
  if (typeof form.value.equipment === 'string') {
    // The name of an equipment
    equipment = {
      name: form.value.equipment
    };
  } else if (form.value.equipment instanceof Equipment) {
    equipment = form.value.equipment;
  } else {
    throw new Error('Equipment not set on form');
  }

  const costEstimates = form.value.hasCostEstimates
    ? costEstimatesFromForm(form.controls.cost, 'unit')
    : null;


  return {
    equipment: equipment,
    lab,
    funding,
    reason: form.value.reason!,
    estimatedCost: costEstimates?.perUnitCost || null,
    quantityRequired: costEstimates?.quantityRequired || 1,
    purchaseUrl: form.value.purchaseUrl || ''
  };
}

@Component({
  selector: 'lab-equipment-provision-request-form',
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
        [funding]="funding!"
        unitOfMeasurement="unit"
      >
      @if (costErrors) {
        <mat-error>{{costErrors | json}}</mat-error>
      }
      </uni-research-funding-cost-estimate-form>
    </form>
  `,
})
export class EquipmentProvisioiningRequestFormComponent {
  readonly form = equipmentRequestForm();

  @Input({ required: true })
  lab: Lab | null = null;

  @Input({ required: true })
  funding: ResearchFunding | undefined = undefined;

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
  get equipmentName(): string {
    const equipment = this.form.value.equipment;
    if (typeof equipment === 'string') {
      return equipment;
    }
    return equipment?.name || '??';
  }
  set equipmentName(value: string | null) {
    this.form.patchValue({ equipment: value || '' });
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

  get costErrors() {
    return this.form.controls.cost.errors;
  }
}
