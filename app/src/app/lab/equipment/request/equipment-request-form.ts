import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  Observable,
  OperatorFunction,
  Subscription,
  map,
  merge,
  pipe,
  tap,
  withLatestFrom,
} from 'rxjs';
import {
  CostEstimateForm,
  costEstimateForm,
  costEstimatesFromForm,
  setCostEstimateFormValue,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { EquipmentRequest } from './equipment-request';
import { Q } from '@angular/cdk/keycodes';

export interface EquipmentRequestFormControls {
  name: FormControl<string>;
  reason: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  cost: CostEstimateForm;
}

export type EquipmentRequestForm = FormGroup<EquipmentRequestFormControls>;

export function equipmentRequestForm(
  equipmentName?: string,
): EquipmentRequestForm {
  return new FormGroup({
    name: new FormControl<string>(equipmentName || '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reason: new FormControl<string>('', {
      nonNullable: true,
    }),
    hasCostEstimates: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    cost: costEstimateForm(),
  });
}

export function setEquipmentRequestFormValue(
  form: EquipmentRequestForm,
  committed: EquipmentRequest | null,
) {
  if (committed == null) {
    form.reset();
  } else {
    setCostEstimateFormValue(form.controls['cost'], committed.cost);
    form.patchValue({
      name: committed.name,
      reason: committed.reason,
      hasCostEstimates: committed.cost != null,
    });
  }
}

export function equipmentRequestFromForm(
  form: EquipmentRequestForm,
): EquipmentRequest {
  if (!form.valid) {
    throw new Error('Invalid form has no value');
  }

  const { name, reason, hasCostEstimates } = form.value;
  return {
    name: name!,
    reason: reason!,
    cost: hasCostEstimates
      ? costEstimatesFromForm(form.controls['cost'], 'item')
      : null,
  };
}
