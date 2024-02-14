import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { filter, firstValueFrom, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanInput } from '@angular/cdk/coercion';
import { LabEquipmentProvision, LabEquipmentProvisionRequest, LabEquipmentProvisioningService } from './equipment-provision';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { CostEstimateForm, CostEstimateFormComponent, costEstimateForm, costEstimatesFromFormValue, setCostEstimateFormValue } from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { Equipment, LabEquipmentCreateRequest } from '../equipment';
import { Lab } from '../../lab/lab';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type NewEquipmentRequestForm = FormGroup<{
  equipmentName: FormControl<string>;
  reason: FormControl<string>;
  hasCostEstimates: FormControl<boolean>;
  cost: CostEstimateForm;
  purchaseUrl: FormControl<string>;
}>;


@Component({
  selector: 'equipment-provision-new-equipment-form',
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

        <mat-error *ngIf="equipmentNameErrors && equipmentNameErrors['required']">
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
export class NewEquipmentRequestFormComponent {
  readonly equipmentProvisionService = inject(LabEquipmentProvisioningService);
  readonly form: NewEquipmentRequestForm = new FormGroup({
    equipmentName: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        (c) => this.equipmentNameRequiredValidator(c)
      ]
    }),
    reason: new FormControl<string>('', {
      nonNullable: true,
    }),
    hasCostEstimates: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    cost: costEstimateForm(),
    purchaseUrl: new FormControl('', { nonNullable: true })
  });

  /**
   * The equipment to provision (if known)
   */
  @Input()
  equipment: Equipment | null = null;

  equipmentNameRequiredValidator(control: AbstractControl<string>) {
    if (this.equipment == null) {
      return Validators.required(control);
    }
    return null;
  }

  /**
   * The lab that the equipment should be provisioned for.
   * If `null`, then the equipment can be provisioned into any lab.
   */
  @Input({ required: true })
  lab: Lab | null = null;

  @Input({ required: true })
  funding: ResearchFunding | undefined;

  @Output()
  readonly save = new EventEmitter<LabEquipmentProvision>();

  @Input()
  get equipmentName() {
    return this.equipmentNameControl.value || '';
  }
  set equipmentName(value: string) {
    this.equipmentNameControl.setValue(value);
  }

  get equipmentNameControl(): FormControl<string> {
    return this.form.controls.equipmentName;
  }

  get equipmentNameErrors(): ValidationErrors | null {
    return this.equipmentNameControl.errors;
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
  _createProvisionRequest(): LabEquipmentProvisionRequest {
    if (!this.form.valid) {
      throw new Error('Invalid form has no value');
    }
    let equipment: LabEquipmentCreateRequest | Equipment;
    if (this.equipment != null) {
      // The name of an equipment
      equipment = this.equipment;
    } else {
      equipment = {
        name: this.form.value.equipmentName!
      };
    }

    const costEstimates = this.form.value.hasCostEstimates
      ? costEstimatesFromFormValue(this.form.value.cost!, 'unit')
      : null;


    return {
      equipment: equipment,
      lab: this.lab,
      funding: this.funding!,
      reason: this.form.value.reason!,
      estimatedCost: costEstimates?.perUnitCost || null,
      quantityRequired: costEstimates?.quantityRequired || 1,
      purchaseUrl: this.form.value.purchaseUrl || ''
    };
  }
  async onFormSubmit() {
    if (!this.form.valid) {
      throw new Error(`Cannot submit invalid form`)
    }
    const request = this._createProvisionRequest();
    const provision = await firstValueFrom(this.equipmentProvisionService.request(request));
    this.save.emit(provision);
  }
}
