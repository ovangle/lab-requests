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
import { SoftwareLease, SoftwareLeaseParams, SoftwareLeasePatch, SoftwareLeaseService } from './software-lease';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResourceFormComponent } from '../../abstract-resource-form.component';
import { ResearchFundingCostEstimateFormComponent } from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { TextFieldModule } from '@angular/cdk/text-field';

export type SoftwareLeaseForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  minVersion: FormControl<string>;

  isLocalInstall: FormControl<boolean>;
  isLicenseRequired: FormControl<boolean>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: FormControl<number | null>;
}>;

export function softwareLeaseForm(committed: SoftwareLease | null): SoftwareLeaseForm {
  return new FormGroup({
    name: new FormControl<string>(committed?.software?.name || '', {
      validators: [ Validators.required ],
      nonNullable: true,
    }),
    description: new FormControl('', { nonNullable: true }),
    minVersion: new FormControl('', { nonNullable: true }),
    isLocalInstall: new FormControl(false, { nonNullable: true }),
    isLicenseRequired: new FormControl(false, { nonNullable: true }),

    hasCostEstimates: new FormControl<boolean>(false, { nonNullable: true }),
    estimatedCost: new FormControl<number | null>(null)
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

    TextFieldModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    ResearchFundingCostEstimateFormComponent
  ],
  template: `
  @if (form) {
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput id="software-name" formControlName="name" required />

        @if (nameErrors && nameErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Usage description</mat-label>
        <textarea
          matInput
          type="text"
          id="software-description"
          formControlName="description"
          cdkTextareaAutosize
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

      <mat-checkbox formControlName="isLocalInstall">
        <!-- TODO: Inject lab information -->
        This software must be installed in the research lab
      </mat-checkbox>

      @if (isLocalInstall) {
        <mat-checkbox formControlName="isLicenseRequired">
          This software requires a licence seat
        </mat-checkbox>
      }

      @if (isLicenseRequired && funding) {
        <research-funding-cost-estimate-form
          [funding]="funding"
          unitOfMeasurement="license seat"
        />
      }
    </form>
  }
  `,
  styles: [
    `
      form {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
  providers: [
    SoftwareLeaseService
  ]
})
export class SoftwareLeaseFormComponent extends ResourceFormComponent<SoftwareLease, SoftwareLeaseForm, SoftwareLeasePatch> {
  override readonly resourceType = 'software_lease';
  override readonly service = inject(SoftwareLeaseService);

  @Input()
  funding: ResearchFunding | null = null;

  get isLocalInstall() {
    return !!this.form?.value.isLocalInstall;
  }

  get isLicenseRequired() {
    return !!this.form!.value.isLicenseRequired;
  }

  override createForm(committed: SoftwareLease | null): SoftwareLeaseForm {
    return softwareLeaseForm(committed);
  }
  override patchFromFormValue(value: SoftwareLeaseForm[ 'value' ]): SoftwareLeasePatch {
    throw new Error('not implemented');
    /** return { ...patchParams, } **/
  }

  get nameErrors(): ValidationErrors | null {
    if (!this.form) {
      return null;
    }
    return this.form.controls[ 'name' ].errors;
  }
}
