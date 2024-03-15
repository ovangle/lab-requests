import { Component, Input, inject } from '@angular/core';
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
import { ResearchFundingCostEstimateFormComponent } from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { CostEstimate } from 'src/app/research/funding/cost-estimate/cost-estimate';
import { P } from '@angular/cdk/keycodes';
import { UnitOfMeasurement } from 'src/app/common/measurement/measurement';

export type ResourceDisposalForm = FormGroup<{
  type: FormControl<ResourceDisposalType>;
  description: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: FormControl<number | null>;
}>;

export function resourceDisposalForm(): ResourceDisposalForm {
  return new FormGroup({
    type: new FormControl<ResourceDisposalType>('general', {
      nonNullable: true,
      validators: Validators.required,
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    hasCostEstimates: new FormControl<boolean>(true, { nonNullable: true }),
    estimatedCost: new FormControl<number | null>(null)
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

  const estimatedCost = form.value.hasCostEstimates ? form.value.estimatedCost! : null;

  return new ResourceDisposal({
    description,
    estimatedCost,
  });
}

export function patchResourceDisposalFormValue(
  form: ResourceDisposalForm,
  disposal: ResourceDisposal,
  options?: any,
) {
  form.patchValue(
    {
      type: disposal.type,
      description: disposal.description,
      hasCostEstimates: disposal.estimatedCost != null,
      estimatedCost: disposal.estimatedCost || null,
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

    ResearchFundingCostEstimateFormComponent
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

      @if (funding) {
        <research-funding-cost-estimate-form
          [funding]="funding"
          unitOfMeasurement="kg"
          (costEstimateChange)="onCostEstimateChange($event)"
        >
        </research-funding-cost-estimate-form>
      }
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

  @Input()
  funding: ResearchFunding | null = null;

  @Input()
  unitOfMeasurement: UnitOfMeasurement | undefined;

  @Input()
  numUnitsRequired: number = 1;

  _controlContainer = inject(ControlContainer);

  get formGroup(): ResourceDisposalForm {
    return this._controlContainer.control as ResourceDisposalForm;
  }

  onCostEstimateChange(value: CostEstimate) {
    this.formGroup.patchValue({
      estimatedCost: value.perUnitCost
    });
  }
}
