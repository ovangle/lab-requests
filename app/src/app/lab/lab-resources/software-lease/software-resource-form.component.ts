import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Injectable, Input, Output, ViewChild, inject } from '@angular/core';
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
import { SoftwareLease, SoftwareLeaseParams } from './software-lease';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ProvisionFormComponent } from '../../lab-resource/provision/provision-form.component';
import { ResourceContext } from '../../lab-resource/resource-context';

export type SoftwareLeaseForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  minVersion: FormControl<string>;

  isLicenseRequired: FormControl<boolean>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: CostEstimateForm;
}>;

export function softwareLeaseForm(lease?: Partial<SoftwareLease>): SoftwareLeaseForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    description: new FormControl('', { nonNullable: true }),
    minVersion: new FormControl('', { nonNullable: true }),
    isLicenseRequired: new FormControl(false, { nonNullable: true }),

    hasCostEstimates: new FormControl<boolean>(false, { nonNullable: true }),
    estimatedCost: costEstimateForm(),
  });
}

export type SoftwareLeaseFormErrors = ValidationErrors & {
  name?: { required: string | null };
};

@Component({
  selector: 'lab-software-lease-form',
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
    <form [formGroup]="form!">
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
export class SoftwareLeaseFormComponent {
  readonly context = inject(ResourceContext<SoftwareLease>);

  form: SoftwareLeaseForm | undefined;

  @Output()
  patchChange = new EventEmitter<SoftwareLeaseParams>();

  @Output()
  hasError = new EventEmitter<boolean>();

  ngOnInit() {
    this.context.committed$.subscribe(committed => {
      this.form = softwareLeaseForm(committed);
    });
  }

  get isLicenseRequired() {
    return !!this.form!.value.isLicenseRequired;
  }
}
