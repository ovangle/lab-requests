import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter, firstValueFrom, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanInput } from '@angular/cdk/coercion';
import { LabEquipmentProvision, LabEquipmentProvisionRequest, LabEquipmentProvisioningService } from './lab-equipment-provision';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { CostEstimateForm, CostEstimateFormComponent, costEstimateForm, costEstimatesFromForm, setCostEstimateFormValue } from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { Equipment, LabEquipmentCreateRequest } from '../equipment';
import { Lab } from '../../lab';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type EquipmentRequestForm = FormGroup<{
  /**
   * The lab for which we are requesting the provision.
   * `null` is interpreted as `any`
   */
  lab: FormControl<Lab | null>;
  funding: FormControl<ResearchFunding | null>;
  /**
   * Either an equipment, or the name of an equipment to create
   */
  equipment: FormControl<Equipment | string>;
  reason: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  cost: CostEstimateForm;
  purchaseUrl: FormControl<string>;
}>;

export function equipmentRequestForm(
  equipmentName?: string,
): EquipmentRequestForm {
  return new FormGroup({
    lab: new FormControl<Lab | null>(null),
    funding: new FormControl<ResearchFunding | null>(null, {
      validators: Validators.required
    }),
    equipment: new FormControl<Equipment | string>(
      equipmentName || '', { nonNullable: true }
    ),
    reason: new FormControl<string>('', {
      nonNullable: true,
    }),
    hasCostEstimates: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    cost: costEstimateForm(),
    purchaseUrl: new FormControl('', { nonNullable: true })
  });
}

export function equipmentRequestFromForm(
  form: EquipmentRequestForm,
): LabEquipmentProvisionRequest {
  if (!form.valid) {
    throw new Error('Invalid form has no value');
  }
  let equipment: Equipment | LabEquipmentCreateRequest;
  if (typeof form.value.equipment === 'string') {
    // The name of an equipment
    equipment = {
      name: form.value.equipment
    };
  } else if (form.value.equipment instanceof Equipment) {
    equipment = form.value.equipment;
  } else {
    throw new Error('Equipment not set on form');
  }

  const costEstimates = form.value.hasCostEstimates
    ? costEstimatesFromForm(form.controls.cost, 'unit')
    : null;


  return {
    equipment: equipment,
    lab: form.value.lab?.id || null,
    funding: form.value.funding!,
    reason: form.value.reason!,
    estimatedCost: costEstimates?.perUnitCost || null,
    quantityRequired: costEstimates?.quantityRequired || 1,
    purchaseUrl: form.value.purchaseUrl || ''
  };
}

@Component({
  selector: 'lab-equipment-provision-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,

    ResizeTextareaOnInputDirective,
    CostEstimateFormComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()">
    
      <mat-form-field>
        <mat-label>Equipment Name</mat-label>
        <input matInput formControlName="equipment" required/>

        <mat-error *ngIf="equipmentErrors && equipmentErrors['required']">
          A value is required
        </mat-error>
      </mat-form-field>

      <mat-form-field>
        <mat-label>Reason to purchase</mat-label>
        <textarea matInput formControlName="reason" resizeOnInput> </textarea>
      </mat-form-field>

      <uni-research-funding-cost-estimate-form
        [form]="form.controls.cost"
        name="purchase"
        [funding]="funding!"
        unitOfMeasurement="unit"
      >
      </uni-research-funding-cost-estimate-form>

      <mat-form-field>
        <mat-label>Purchase url</mat-label>

        <input matInput formControlName="purchaseUrl">
        
        <mat-hint>Url of an address where requested item can be purchased</mat-hint>
      </mat-form-field>

      <div class="form-controls">
        <button mat-raised-button type="submit"
                [disabled]="!form.valid">
          <mat-icon>save</mat-icon> Submit
        </button>
      </div>
    </form>
  `,
})
export class EquipmentProvisionRequestFormComponent {
  readonly equipmentProvisionService = inject(LabEquipmentProvisioningService);
  readonly form = equipmentRequestForm();


  /**
   * The lab that the equipment should be installed into.
   * If `null`, then the equipment can be provisioned into any lab.
   */
  @Input({ required: true })
  get lab(): Lab | null {
    return this.form.value.lab!;
  }
  set lab(lab: Lab | null) {
    this.form.patchValue({ lab });
  }

  @Input({ required: true })
  get funding(): ResearchFunding {
    return this.form.value.funding!;
  }
  set funding(funding: ResearchFunding) {
    this.form.patchValue({ funding });
  }

  @Output()
  readonly save = new EventEmitter<LabEquipmentProvision>();

  // Allow binding to name in order to pre-populate the field.
  @Input()
  get equipmentName(): string {
    const equipment = this.form.value.equipment;
    if (typeof equipment === 'string') {
      return equipment;
    }
    return equipment?.name || '??';
  }
  set equipmentName(value: string | null) {
    this.form.patchValue({ equipment: value || '' });
  }

  get equipmentErrors(): ValidationErrors | null {
    return this.form.controls.equipment.errors;
  }

  @Input()
  get disabled() {
    return this.form.disabled;
  }
  set disabled(isDisabled: BooleanInput) {
    if (isDisabled && !this.form.disabled) {
      this.form.disable();
    }
    if (!isDisabled && this.form.disabled) {
      this.form.enable();
    }
  }

  get costErrors() {
    return this.form.controls.cost.errors;
  }

  async onFormSubmit() {
    if (!this.form.valid) {
      throw new Error(`Cannot submit invalid form`)
    }
    const request = equipmentRequestFromForm(this.form);
    const provision = await firstValueFrom(this.equipmentProvisionService.request(request));
    this.save.emit(provision);
  }
}
