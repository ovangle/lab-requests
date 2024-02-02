import { CommonModule } from '@angular/common';
import { Component, Input, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EquipmentLease } from './equipment-lease';
import { Observable, defer, filter, map, startWith } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/lab/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/lab/equipment/training/training-acknowlegment-input.component';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { EquipmentLike } from 'src/app/lab/equipment/equipment-like';
import { Equipment } from 'src/app/lab/equipment/equipment';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { ResourceContext } from '../../lab-resource/resource';
import { injectMaybeLabFromContext } from '../../lab-context';
import { Lab } from '../../lab';

export type EquipmentLeaseForm = FormGroup<{
  equipment: FormControl<EquipmentLike | null>;
  equipmentTrainingCompleted: FormControl<string[]>;
  requireSupervision: FormControl<boolean>;

  setupInstructions: FormControl<string>;
  usageCostEstimate: CostEstimateForm;
}>;

export function equipmentLeaseForm(
  lease?: Partial<EquipmentLease>,
): EquipmentLeaseForm {
  return new FormGroup({
    equipment: new FormControl<EquipmentLike | null>(
      lease?.equipment || (null as any),
      { validators: [ Validators.required ] },
    ),
    equipmentTrainingCompleted: new FormControl<string[]>(
      lease?.equipmentTrainingCompleted || [],
      { nonNullable: true },
    ),
    requireSupervision: new FormControl<boolean>(!!lease?.requireSupervision, {
      nonNullable: true,
    }),
    setupInstructions: new FormControl<string>(lease?.setupInstructions || '', {
      nonNullable: true,
    }),
    usageCostEstimate: costEstimateForm(),
  });
}

export type EquipmentLeaseFormErrors = ValidationErrors & {
  equipment?: { required: string | null };
};

@Component({
  selector: 'lab-equipment-lease-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,

    EquipmentSearchComponent,
    EquipmentTrainingAcknowlegementComponent,
    EquipmentRiskAssessmentFileInputComponent,
  ],
  template: `
  @if (form) {
    <form [formGroup]="form">
      @if (lab$ | async; as lab) {
        <lab-equipment-search
          formControlName="equipment"
          [funding]="funding"
          [inLab]="lab"
        >
          <mat-label>Equipment</mat-label>
        </lab-equipment-search>
      }

      @if (
        selectedEquipmentTrainingDescriptions$ | async;
        as trainingDescriptions
      ) {
        <lab-equipment-training-acknowledgement
          [trainingDescriptions]="trainingDescriptions"
          formControlName="equipmentTrainingCompleted"
        />
      }

      @if (selectedEquipment$ | async; as equipment) {
        <mat-checkbox formControlName="requireSupervision">
          I require additional assistance using this equipment
        </mat-checkbox>
      }

      <ng-container>
        <lab-equipment-risk-assessment-file-input />
      </ng-container>
    </form>
  }
  `,
})
export class EquipmentLeaseFormComponent {
  readonly lab$: Observable<Lab | null> = injectMaybeLabFromContext();
  readonly context = inject(ResourceContext<EquipmentLease>);

  form: EquipmentLeaseForm | undefined;

  @Input({ required: true })
  funding: ResearchFunding | undefined = undefined;

  get equipmentControl(): FormControl<EquipmentLike | null> {
    return this.form!.controls.equipment;
  }

  ngOnInit() {
    this.context.committed$.subscribe(committed => {
      this.form = equipmentLeaseForm(committed);
    })
  }

  readonly selectedEquipment$: Observable<EquipmentLike | null> = defer(() =>
    this.equipmentControl.valueChanges.pipe(
      startWith(this.equipmentControl.value),
      map((value) => {
        if (!this.equipmentControl.valid) {
          return null;
        }
        return value;
      }),
    ),
  );

  readonly selectedEquipmentTrainingDescriptions$: Observable<string[] | null> =
    defer(() =>
      this.selectedEquipment$.pipe(
        map((equipment) => {
          if (equipment instanceof Equipment) {
            return equipment.trainingDescriptions;
          }
          return null;
        }),
      ),
    );
}
