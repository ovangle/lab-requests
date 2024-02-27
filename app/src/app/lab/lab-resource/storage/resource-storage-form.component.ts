import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  RESOURCE_STORAGE_TYPES,
  ResourceStorage,
  ResourceStorageType,
  storageCostPerWeek,
} from './resource-storage';
import {
  ChangeDetectorRef,
  Component,
  Input,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { SelectOtherDescriptionComponent } from 'src/app/utils/forms/select-other-description.component';
import {
  ResearchFundingCostEstimateFormComponent,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { differenceInCalendarWeeks } from 'date-fns';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { CostEstimate } from 'src/app/research/funding/cost-estimate/cost-estimate';

export type ResourceStorageForm = FormGroup<{
  type: FormControl<ResourceStorageType>;
  description: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  estimatedCost: FormControl<number>;
}>;

export function resourceStorageForm(): ResourceStorageForm {
  return new FormGroup({
    type: new FormControl<ResourceStorageType>('general', {
      nonNullable: true,
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    hasCostEstimates: new FormControl(false, { nonNullable: true }),
    estimatedCost: new FormControl<number>(0, { nonNullable: true }),
  });
}

export function resourceStorageFromFormValue(
  value: ResourceStorageForm[ 'value' ],
): ResourceStorage {
  const description =
    value.type === 'other' ? value.description : value.type!;

  return new ResourceStorage({
    description,
    estimatedCost: value.estimatedCost || null,
  });
}

export function patchResourceStorageFormValue(
  form: ResourceStorageForm,
  storage: ResourceStorage,
  options?: any,
) {
  form.patchValue(
    {
      type: storage.type,
      description: storage.description,
      hasCostEstimates: storage.estimatedCost != null,
      estimatedCost: storage.estimatedCost || 0,
    },
    options,
  );
}

@Component({
  selector: 'lab-resource-storage-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    SelectOtherDescriptionComponent,
    ResearchFundingCostEstimateFormComponent,
  ],
  template: `
    <h3>Storage</h3>
    <ng-container [formGroup]="form!">
      <div class="d-flex">
        <mat-form-field>
          <mat-label>Storage type</mat-label>
          <mat-select formControlName="type">
            <mat-option [value]="null">none required</mat-option>
            <mat-option
              *ngFor="let storageType of storageTypes"
              [value]="storageType"
            >
              {{ storageType }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <lab-req-select-other-description
          [isOtherSelected]="isOtherTypeSelected"
          formControlName="description"
        >
        </lab-req-select-other-description>
      </div>

      per week storage cost: {{ perWeekStorageCost }} quantity required:
      {{ numWeeksInProject }}

      @if (funding) {
        <research-funding-cost-estimate-form
          [funding]="funding"
          name="storage costs"
          [perUnitCost]="perWeekStorageCost"
          [quantityRequired]="numWeeksInProject"
          unitOfMeasurement="weeks"
          (costEstimateChange)="_onCostEstimateChange($event)"
        />
     }
    </ng-container>
  `,
  styles: [
    `
      :host {
        padding-bottom: 1em;
      }
      mat-form-field {
        width: 100%;
      }
      div[matTextSuffix] {
        padding-left: 0.2em;
      }
    `,
  ],
})
export class ResourceStorageFormComponent {
  readonly _cdRef = inject(ChangeDetectorRef);

  readonly storageTypes = RESOURCE_STORAGE_TYPES;

  @Input({ required: true })
  form: ResourceStorageForm | undefined = undefined;

  @Input()
  funding: ResearchFunding | null = null;

  @Input()
  storageStartDate: Date | null = null;

  @Input()
  storageEndDate: Date | null = null;

  ngOnChanges(changes: SimpleChanges) {
    const storageStartDate = changes[ 'storageStartDate' ];
    const storageEndDate = changes[ 'storageEndDate' ];
    if (storageStartDate || storageEndDate) {
      const hasCostEstimates =
        storageStartDate.currentValue && storageEndDate.currentValue;
      this.form!.patchValue({ hasCostEstimates });
      this._cdRef.detectChanges();
    }
  }

  get numWeeksInProject(): number {
    if (this.storageStartDate == null || this.storageEndDate == null) {
      return 0;
    }
    return differenceInCalendarWeeks(
      this.storageStartDate,
      this.storageEndDate,
    );
  }

  get isOtherTypeSelected() {
    return this.form!.value.type === 'other';
  }

  get perWeekStorageCost() {
    const t = this.form!.value.type || 'other';
    console.log('storage type', t, storageCostPerWeek(t));
    return storageCostPerWeek(t);
  }

  _onCostEstimateChange(cost: CostEstimate) {

  }
}
