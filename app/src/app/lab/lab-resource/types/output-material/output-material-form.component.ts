import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OutputMaterial, OutputMaterialPatch, OutputMaterialService } from './output-material';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, first, map } from 'rxjs';
import { groupDisabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';

import { ResourceService } from '../../resource';
import {
  ResourceDisposalForm,
  resourceDisposalForm,
  ResourceDisposalFormComponent,
} from '../../disposal/resource-disposal-form.component';
import { HazardClassesSelectComponent } from '../../hazardous/hazard-classes-select.component';
import { HazardClass } from '../../hazardous/hazardous';
import {
  ResourceStorageForm,
  resourceStorageForm,
  ResourceStorageFormComponent,
} from '../../storage/resource-storage-form.component';
import { ResourceFormComponent } from '../../abstract-resource-form.component';

export type OutputMaterialForm = FormGroup<{
  name: FormControl<string>;
  baseUnit: FormControl<string>;
  numUnitsProduced: FormControl<number>;

  storage: ResourceStorageForm;
  disposal: ResourceDisposalForm;
  hazardClasses: FormControl<HazardClass[]>;
}>;

function outputMaterialForm(outputMaterial: OutputMaterial | null): OutputMaterialForm {
  return new FormGroup({
    name: new FormControl<string>(outputMaterial?.name || '', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    baseUnit: new FormControl<string>(outputMaterial?.baseUnit || '', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    numUnitsProduced: new FormControl(outputMaterial?.numUnitsProduced || 0, { nonNullable: true }),

    storage: resourceStorageForm(),
    disposal: resourceDisposalForm(),

    hazardClasses: new FormControl<HazardClass[]>([], { nonNullable: true }),
  });
}

function outputMaterialPatch(committed: OutputMaterial | null, value: OutputMaterialForm[ 'value' ]) {

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

@Component({
  selector: 'lab-output-material-form',
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
  @if (form) {
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
  }
  `,
  providers: [
    OutputMaterialService
  ]
})
export class OutputMaterialFormComponent extends ResourceFormComponent<OutputMaterial, OutputMaterialForm, OutputMaterialPatch> {
  override readonly resourceType = 'output_material';
  override readonly service: ResourceService<OutputMaterial, OutputMaterialPatch> = inject(OutputMaterialService);
  override patchFromFormValue(form: OutputMaterialForm[ 'value' ]): Promise<OutputMaterialPatch> {
    throw new Error('Method not implemented.');
  }


  get baseUnit(): string {
    return this.form!.value.baseUnit || '';
  }

  override createForm(committed: OutputMaterial | null): OutputMaterialForm {
    return outputMaterialForm(committed);
  }

}
