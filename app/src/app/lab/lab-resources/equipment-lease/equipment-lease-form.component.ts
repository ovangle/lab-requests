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
import { EquipmentLease, EquipmentLeaseParams } from './equipment-lease';
import { Observable, defer, filter, firstValueFrom, map, startWith, switchMap } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/lab/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/lab/equipment/training/training-acknowlegment-input.component';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { EquipmentLike } from 'src/app/lab/equipment/equipment-like';
import { Equipment, EquipmentInstallation, injectEquipmentService } from 'src/app/lab/equipment/equipment';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { ResourceContext } from '../../lab-resource/resource-context';
import { injectMaybeLabFromContext } from '../../lab-context';
import { Lab } from '../../lab';
import { LabEquipmentProvision } from '../../equipment/provision/lab-equipment-provision';
import { CostEstimate } from 'src/app/research/funding/cost-estimate/cost-estimate';

export type EquipmentLeaseForm = FormGroup<{
  equipment: FormControl<EquipmentLike | null>;
  equipmentTrainingCompleted: FormControl<string[]>;
  requireSupervision: FormControl<boolean>;

  setupInstructions: FormControl<string>;
  usageCostEstimate: CostEstimateForm;
}>;

function equipmentLeaseForm(
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
      <lab-equipment-search
        formControlName="equipment"
        [funding]="funding"
        [inLab]="lab$ | async"
      >
        <mat-label>Equipment</mat-label>
      </lab-equipment-search>

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
  readonly _equipments = injectEquipmentService();

  form: EquipmentLeaseForm | undefined;

  @Input({ required: true })
  funding: ResearchFunding | undefined = undefined;

  get equipmentControl(): FormControl<EquipmentLike | null> {
    return this.form!.controls.equipment;
  }

  @Output()
  patchChange = new EventEmitter<EquipmentLease>();

  @Output()
  hasError = new EventEmitter<boolean>();

  ngOnInit() {
    this.context.committed$.subscribe(committed => {
      this.form = equipmentLeaseForm(committed);
      this.form.valueChanges.subscribe(value => {
        this.hasError.emit(this.form!.valid);
      })
      this.form.valueChanges.pipe(
        filter(() => this.form!.valid),
        switchMap(() => this._getFormValue(committed)),
      ).subscribe(equipmentLease => {
        this.patchChange.emit(equipmentLease);
      })
    })
  }

  async _getFormValue(committed: EquipmentLease | null) {
    if (!this.form) {
      throw new Error('Resource form not initialized');
    }
    if (!this.form.valid) {
      throw new Error('Invalid form has no value');
    }

    let [ type, index ] = await firstValueFrom(this.context.committedTypeIndex$);
    const equipment_ = this.form.value.equipment!;
    let equipment: Equipment;
    let equipmentProvision: LabEquipmentProvision | null;
    if (equipment_ instanceof Equipment) {
      equipment = equipment_;
      equipmentProvision = null;
    } else if (equipment_ instanceof EquipmentInstallation) {
      equipment = await firstValueFrom(this._equipments.fetch(equipment_.equipmentId));
      equipmentProvision = null;
    } else if (equipment_ instanceof LabEquipmentProvision) {
      equipment = await firstValueFrom(this._equipments.fetch(equipment_.equipmentId));
      equipmentProvision = equipment_;
    } else {
      throw new Error('Expected an equipment-like value');
    }

    return new EquipmentLease({
      id: committed?.id || null,
      type,
      index,
      equipment,
      equipmentProvision,
      equipmentTrainingCompleted: new Set(this.form.value.equipmentTrainingCompleted!),
      requireSupervision: this.form.value.requireSupervision!,
      setupInstructions: this.form.value.setupInstructions!,
      usageCostEstimate: {
        unit: 'hour',
        ...this.form.value.usageCostEstimate
      } as CostEstimate
    });
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
