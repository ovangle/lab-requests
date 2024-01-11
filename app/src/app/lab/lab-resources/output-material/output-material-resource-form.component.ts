import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OutputMaterial } from './output-material';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, map } from 'rxjs';
import { groupDisabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import {
  ResourceDisposalForm,
  resourceDisposalForm,
  ResourceDisposalFormComponent,
} from '../../lab-resource/disposal/resource-disposal-form.component';
import { HazardClassesSelectComponent } from '../../lab-resource/hazardous/hazard-classes-select.component';
import { HazardClass } from '../../lab-resource/hazardous/hazardous';
import { ResourceFormService } from '../../lab-resource/resource-form.service';
import {
  ResourceStorageForm,
  resourceStorageForm,
  ResourceStorageFormComponent,
} from '../../lab-resource/storage/resource-storage-form.component';

export type OutputMaterialForm = FormGroup<{
  name: FormControl<string>;
  baseUnit: FormControl<string>;
  numUnitsProduced: FormControl<number>;

  storage: ResourceStorageForm;
  disposal: ResourceDisposalForm;
  hazardClasses: FormControl<HazardClass[]>;
}>;

export function createOutputMaterialForm(): OutputMaterialForm {
  return new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    baseUnit: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    numUnitsProduced: new FormControl(0, { nonNullable: true }),

    storage: resourceStorageForm(),
    disposal: resourceDisposalForm(),

    hazardClasses: new FormControl<HazardClass[]>([], { nonNullable: true }),
  });
}

export function disableDependentControlsWithBaseUnitValidity(
  outputMaterialForm: OutputMaterialForm,
): Subscription {
  const toggler = groupDisabledStateToggler(outputMaterialForm, [
    'numUnitsProduced',
    'storage',
    'disposal',
    'hazardClasses',
  ]);

  return outputMaterialForm.valueChanges
    .pipe(
      takeUntilDestroyed(),
      map((value) => {
        const baseUnit = value.baseUnit;
        return baseUnit != '';
      }),
    )
    .subscribe(toggler);
}

export type OutputMaterialFormErrors = ValidationErrors & {
  name?: { required: string | null };
  baseUnit?: { required: string | null };
};
@Component({
  selector: 'lab-output-material-resource-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,

    ResourceStorageFormComponent,
    ResourceDisposalFormComponent,
    HazardClassesSelectComponent,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Base unit</mat-label>
        <input matInput formControlName="baseUnit" />
      </mat-form-field>

      @if (baseUnit) {
        <mat-form-field>
          <mat-label>Estimated units produced</mat-label>
          <input matInput type="number" formControlName="numUnitsProduced" />
          <div matTextSuffix>{{ baseUnit }}</div>
        </mat-form-field>

        <lab-req-resource-storage-form formGroupName="storage">
        </lab-req-resource-storage-form>

        <lab-req-resource-disposal-form formGroupName="disposal">
        </lab-req-resource-disposal-form>

        <lab-req-hazard-classes-select formControlName="hazardClasses">
        </lab-req-hazard-classes-select>
      }
    </form>
  `,
})
export class OutputMaterialResourceFormComponent {
  _formService = inject(
    ResourceFormService<OutputMaterial, OutputMaterialForm>,
  );

  get form(): OutputMaterialForm {
    return this._formService.form;
  }

  get baseUnit(): string {
    return this.form.value.baseUnit || '';
  }
}
