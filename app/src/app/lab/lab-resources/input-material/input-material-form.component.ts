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
import { InputMaterial, InputMaterialParams } from './input-material';

import { CommonMeasurementUnitInputComponent } from 'src/app/common/measurement/common-measurement-unit-input.component';
import { MeasurementUnitPipe } from 'src/app/common/measurement/common-measurement-unit.pipe';
import {
  ResearchFundingCostEstimateFormComponent,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { BehaviorSubject, first } from 'rxjs';
import { HazardClassesSelectComponent } from '../../lab-resource/hazardous/hazard-classes-select.component';
import { HazardClass } from '../../lab-resource/hazardous/hazardous';
import {
  ResourceStorageForm,
  resourceStorageForm,
  ResourceStorageFormComponent,
  resourceStorageFromFormValue,
} from '../../lab-resource/storage/resource-storage-form.component';
import { WorkUnitContext } from '../../work-unit/common/work-unit';
import { ResourceContext } from '../../lab-resource/resource-context';
import { ResourceFormComponent } from '../../lab-resource/abstract-resource-form.component';
import { CostEstimate } from 'src/app/research/funding/cost-estimate/cost-estimate';
import { ResourceParams } from '../../lab-resource/resource';
import { ResearchPlanContext } from 'src/app/research/plan/research-plan-context';

export type InputMaterialForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  baseUnit: FormControl<string>;

  numUnitsRequired: FormControl<number>;

  storage: ResourceStorageForm;
  hazardClasses: FormControl<HazardClass[]>;

  perUnitCostEstimate: FormControl<number>;
}>;

function inputMaterialForm(inputMaterial: InputMaterial | null): InputMaterialForm {
  return new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    baseUnit: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    numUnitsRequired: new FormControl<number>(0, { nonNullable: true }),
    perUnitCostEstimate: new FormControl<number>(0, { nonNullable: true }),
    storage: resourceStorageForm(),
    hazardClasses: new FormControl<HazardClass[]>([], { nonNullable: true }),
  });
}

function inputMaterialFromFormValue(patchParams: ResourceParams, value: InputMaterialForm[ 'value' ]): InputMaterial {
  return new InputMaterial({
    ...patchParams,
    name: value.name!,
    description: value.description || '',
    baseUnit: value.baseUnit!,

    numUnitsRequired: value.numUnitsRequired!,
    perUnitCostEstimate: value.perUnitCostEstimate!,

    storage: resourceStorageFromFormValue(value.storage!),
    hazardClasses: value?.hazardClasses || []
  })

}

export type InputMaterialFormErrors = ValidationErrors & {
  name?: { required: string | null };
  baseUnit?: { required: string | null };
};

@Component({
  selector: 'lab-input-material-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,

    MeasurementUnitPipe,
    CommonMeasurementUnitInputComponent,

    ResearchFundingCostEstimateFormComponent,
    HazardClassesSelectComponent,
    ResourceStorageFormComponent,
  ],
  template: `
  @if (form) {
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />

        @if (nameErrors?.required) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Usage description</mat-label>
        <textarea matInput formControlName="description"></textarea>
      </mat-form-field>

      <common-measurement-unit-input formControlName="baseUnit" required>
        <mat-label>Units</mat-label>
      </common-measurement-unit-input>

      @if (funding) {
        <research-funding-cost-estimate-form
          [funding]="funding"
          [unitOfMeasurement]="baseUnit"
        />
      }

      <lab-resource-storage-form
        [form]="form.controls.storage"
        [funding]="funding"
        [storageStartDate]="startDate"
        [storageEndDate]="endDate"
      />

      <lab-req-hazard-classes-select formControlName="hazardClasses">
        <span class="label">Hazard classes</span>
      </lab-req-hazard-classes-select>
    </form>
  }
  `,
  styles: [
    `
      form {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
      }
    `,
  ],
})
export class InputMaterialFormComponent extends ResourceFormComponent<InputMaterial, InputMaterialForm> {
  override createForm(committed: InputMaterial | null): InputMaterialForm {
    return inputMaterialForm(committed);
  }
  override async getPatch(patchParams: ResourceParams, value: InputMaterialForm[ 'value' ]): Promise<InputMaterial> {
    return inputMaterialFromFormValue(patchParams, value);
  }
  readonly _planContext = inject(ResearchPlanContext);

  @Input()
  funding: ResearchFunding | null = null;

  override ngOnDestroy() {
    this._durationSubject.complete();
    super.ngOnDestroy();
  }

  get baseUnit(): string {
    return this.form!.value?.baseUnit || '';
  }

  get nameErrors(): InputMaterialFormErrors[ 'name' ] | null {
    const control = this.form!.controls.name;
    return control.errors as InputMaterialFormErrors[ 'name' ] | null;
  }

  readonly _durationSubject = new BehaviorSubject<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });
  get startDate(): Date | null {
    return this._durationSubject.value.startDate;
  }
  get endDate(): Date | null {
    return this._durationSubject.value.endDate;
  }
}
