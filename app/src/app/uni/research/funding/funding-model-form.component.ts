import { CommonModule } from '@angular/common';
import { Component, Injectable, Input, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { filter, map } from 'rxjs';
import { FundingModelPatch } from './funding-model';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

export type FundingModelForm = FormGroup<{
  description: FormControl<string>;
  supervisorRequired: FormControl<boolean>;
}>;

function patchFromFundingModelForm(form: FundingModelForm): FundingModelPatch {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }
  return form.value as FundingModelPatch;
}

export type FundingModelFormErrors = ValidationErrors & {
  description?: {
    required: string | null;
  };
};

function fundingModelPatchErrorsFromForm(
  form: FundingModelForm,
): FundingModelFormErrors {
  return form.errors as FundingModelFormErrors;
}

@Injectable()
export class FundingModelFormService {
  readonly form: FundingModelForm = new FormGroup(
    {
      description: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      supervisorRequired: new FormControl(false, { nonNullable: true }),
    },
    {
      validators: [(c) => this._validateForm(c as FundingModelForm)],
    },
  );

  readonly patchValue$ = this.form.valueChanges.pipe(
    filter((value): value is FundingModelPatch => this.form.valid),
  );

  readonly formErrors$ = this.form.statusChanges.pipe(
    filter((value) => value === 'INVALID'),
    map(() => fundingModelPatchErrorsFromForm(this.form)),
  );

  _validateForm(form: FundingModelForm): FundingModelFormErrors | null {
    let errors: FundingModelFormErrors | null = null;
    const descriptionControl = form.controls['description'];
    if (descriptionControl.touched && descriptionControl.invalid) {
      errors = errors || {};
      errors['description'] = descriptionControl.errors as any;
    }
    return errors;
  }
}

@Component({
  selector: 'uni-research-funding-model-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <ng-container [formGroup]="form">
      <mat-form-field>
        <mat-label>Description</mat-label>
        <input matInput formControlName="description" />
      </mat-form-field>

      <p>
        <mat-checkbox formControlName="supervisorRequired"></mat-checkbox>
        Supervisor required
      </p>
    </ng-container>
  `,
  providers: [FundingModelFormService],
})
export class FundingModelFormComponent {
  _formService = inject(FundingModelFormService);
  readonly form = this._formService.form;

  @Input()
  get disabled() {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value);
  }
  _disabled: boolean;
}
