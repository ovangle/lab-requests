import { Component, inject } from '@angular/core';
import {
  RESOURCE_DISPOSAL_TYPES,
  ResourceDisposal,
  ResourceDisposalType,
} from './resource-disposal';
import {
  ControlContainer,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { SelectOtherDescriptionComponent } from 'src/app/utils/forms/select-other-description.component';
import { ProvisionFormComponent } from '../provision/provision-form.component';
import {
  CostEstimateForm,
  costEstimateForm,
  costEstimatesFromForm,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';

export type ResourceDisposalForm = FormGroup<{
  type: FormControl<ResourceDisposalType>;
  description: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: CostEstimateForm;
}>;

export function resourceDisposalForm(): ResourceDisposalForm {
  return new FormGroup({
    type: new FormControl<ResourceDisposalType>('general', {
      nonNullable: true,
      validators: Validators.required,
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    hasCostEstimates: new FormControl<boolean>(true, { nonNullable: true }),
    estimatedCost: costEstimateForm(),
  });
}

export function resourceDisposalFromFormValue(
  form: ResourceDisposalForm,
): ResourceDisposal {
  if (!form.valid) {
    throw new Error('Invalid form has no value');
  }
  const description =
    form.value.type === 'other' ? form.value.description! : form.value.type!;

  const estimatedCost = form.value.hasCostEstimates
    ? costEstimatesFromForm(form.controls.estimatedCost, 'kg')
    : null;

  return new ResourceDisposal({
    description,
    estimatedCost,
  });
}

export function patchResourceStorageFormValue(
  form: ResourceDisposalForm,
  storage: ResourceDisposal,
  options?: any,
) {
  form.patchValue(
    {
      type: storage.type,
      description: storage.description,
      hasCostEstimates: storage.estimatedCost != null,
      estimatedCost: storage.estimatedCost || {},
    },
    options,
  );
}

@Component({
  selector: 'lab-resource-disposal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatSelectModule,

    SelectOtherDescriptionComponent,

    ProvisionFormComponent,
  ],
  template: `
    <div class="container" [formGroup]="formGroup">
      <mat-form-field>
        <mat-label>Type</mat-label>
        <mat-select formControlName="type">
          <mat-option
            *ngFor="let disposalType of disposalTypes"
            [value]="disposalType"
          >
            {{ disposalType }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <lab-req-select-other-description
        [isOtherSelected]="formGroup.value['type'] === 'other'"
        formControlName="otherDescription"
      >
      </lab-req-select-other-description>

      <lab-resource-provision-form
        [form]="formGroup"
        [canResearcherSupply]="false"
      >
      </lab-resource-provision-form>
    </div>
  `,
  styles: [
    `
      .container {
        display: flex;
      }
    `,
  ],
})
export class ResourceDisposalFormComponent {
  readonly disposalTypes = RESOURCE_DISPOSAL_TYPES;

  _controlContainer = inject(ControlContainer);

  get formGroup(): ResourceDisposalForm {
    return this._controlContainer.control as ResourceDisposalForm;
  }
}
