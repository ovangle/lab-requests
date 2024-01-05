import { CommonModule } from '@angular/common';
import { Component, Injectable, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Software } from './software';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResourceFormService } from '../../resource/resource-form.service';
import { ProvisionFormComponent } from '../../resource/provision/provision-form.component';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/uni/research/funding/cost-estimate/cost-estimate-form.component';

export type SoftwareForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  minVersion: FormControl<string>;

  isLicenseRequired: FormControl<boolean>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: CostEstimateForm;
}>;

export function softwareForm(): SoftwareForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', { nonNullable: true }),
    minVersion: new FormControl('', { nonNullable: true }),
    isLicenseRequired: new FormControl(false, { nonNullable: true }),

    hasCostEstimates: new FormControl<boolean>(false, { nonNullable: true }),
    estimatedCost: costEstimateForm(),
  });
}

export type SoftwareFormErrors = ValidationErrors & {
  name?: { required: string | null };
};

@Component({
  selector: 'lab-software-resource-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    ProvisionFormComponent,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput id="software-name" formControlName="name" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea
          matInput
          type="text"
          id="software-description"
          formControlName="description"
        >
        </textarea>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Minimum version</mat-label>
        <input
          matInput
          type="text"
          id="software-min-version"
          formControlName="minVersion"
        />
      </mat-form-field>

      <mat-checkbox formControlName="isLicenseRequired">
        This software requires a licence seat
      </mat-checkbox>

      @if (isLicenseRequired) {
        <lab-resource-provision-form
          [form]="form"
          [canResearcherSupply]="false"
          provisioningUnit="per license"
        >
        </lab-resource-provision-form>
      }
    </form>
  `,
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class SoftwareResourceFormComponent {
  readonly formService = inject(ResourceFormService<Software, SoftwareForm>);

  get form(): SoftwareForm {
    return this.formService.form;
  }

  get isLicenseRequired() {
    return !!this.form.value.isLicenseRequired;
  }
}
