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
import { BehaviorSubject, Observable, combineLatest, defer, filter, firstValueFrom, map, of, startWith, switchMap } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/research/funding/cost-estimate/cost-estimate-form.component';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { Equipment, EquipmentService } from 'src/app/equipment/equipment';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { injectMaybeLabFromContext } from '../../lab-context';
import { Lab } from '../../lab';
import { EquipmentProvision } from '../../../equipment/provision/equipment-provision';
import { CostEstimate } from 'src/app/research/funding/cost-estimate/cost-estimate';
import { ResourceFormComponent } from '../../lab-resource/abstract-resource-form.component';
import { ResourceParams } from '../../lab-resource/resource';
import { NotFoundValue } from 'src/app/common/model/search/search-control';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/equipment/training/training-acknowlegment-input.component';

export type EquipmentLeaseForm = FormGroup<{
  equipment: FormControl<Equipment | NotFoundValue | null>;
  equipmentTrainingCompleted: FormControl<string[]>;
  requireSupervision: FormControl<boolean>;

  setupInstructions: FormControl<string>;
  usageCostEstimate: CostEstimateForm;
}>;

function equipmentLeaseForm(
  lease: EquipmentLease | null,
): EquipmentLeaseForm {
  return new FormGroup({
    equipment: new FormControl<Equipment | NotFoundValue | null>(
      lease?.equipment || (null as any),
      { validators: [Validators.required] },
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
      <equipment-search formControlName="equipment" allowNotFound
        [inLab]="lab$ | async"
      >
        <mat-label>Equipment</mat-label>
      </equipment-search>
      
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
export class EquipmentLeaseFormComponent extends ResourceFormComponent<EquipmentLease, EquipmentLeaseForm> {
  readonly lab$: Observable<Lab | null> = injectMaybeLabFromContext();
  readonly _equipments = inject(EquipmentService);

  @Input({ required: true })
  funding: ResearchFunding | undefined = undefined;

  get equipmentControl(): FormControl<Equipment | NotFoundValue | null> {
    return this.form!.controls.equipment;
  }

  createForm(committed: EquipmentLease | null) {
    return equipmentLeaseForm(committed);
  }

  async getPatch(patchParams: ResourceParams, value: EquipmentLeaseForm['value']): Promise<EquipmentLease> {
    const equipment = await firstValueFrom(this.selectedEquipment$);
    const equipmentProvision = this._createdProvisionSubject.value;

    return new EquipmentLease({
      ...patchParams,
      equipment,
      equipmentProvision,
      equipmentTrainingCompleted: new Set(value.equipmentTrainingCompleted!),
      requireSupervision: value.requireSupervision!,
      setupInstructions: value.setupInstructions!,
      usageCostEstimate: {
        unit: 'hour',
        ...value.usageCostEstimate
      } as CostEstimate
    });
  }

  readonly isNewEquipment$ = this.equipmentControl.valueChanges.pipe(
    map(value => value instanceof NotFoundValue)
  );

  readonly prefillEquipmentName$ = this.equipmentControl.valueChanges.pipe(
    map(value => {
      if (value == null) {
        return '';
      } else if (value instanceof Equipment) {
        return value.name
      } else {
        return value.searchInput
      }
    })
  );

  readonly _createdProvisionSubject = new BehaviorSubject<EquipmentProvision | null>(null);
  readonly createdProvision$ = this._createdProvisionSubject.pipe(
    filter((p): p is EquipmentProvision => p != null),
  )
  readonly createdProvisionEquipment$ = this.createdProvision$.pipe(
    switchMap(provision => this._equipments.fetch(provision.equipmentId))
  );


  readonly selectedEquipmentTrainingDescriptions$: Observable<string[] | null> =
    defer(() =>
      this.equipmentControl.valueChanges.pipe(
        map((equipment) => {
          if (equipment instanceof Equipment) {
            return equipment.trainingDescriptions;
          }
          return null;
        }),
      ),
    );

  readonly selectedEquipment$: Observable<Equipment> = this.equipmentControl.valueChanges.pipe(
    switchMap(equipment => {
      if (equipment instanceof Equipment) {
        return of(equipment);
      } else {
        return this.createdProvisionEquipment$
      }
    })
  )
}
