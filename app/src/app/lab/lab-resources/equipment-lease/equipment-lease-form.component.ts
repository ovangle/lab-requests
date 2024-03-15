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
import { BehaviorSubject, Observable, combineLatest, defer, filter, firstValueFrom, map, of, skipWhile, startWith, switchMap, tap } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { Equipment, EquipmentCreateRequest, EquipmentService } from 'src/app/equipment/equipment';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { injectMaybeLabFromContext } from '../../lab-context';
import { Lab } from '../../lab';
import { EquipmentProvision } from '../../../equipment/provision/equipment-provision';
import { ResourceFormComponent } from '../../lab-resource/abstract-resource-form.component';
import { ResourceParams } from '../../lab-resource/resource';
import { NotFoundValue } from 'src/app/common/model/search/search-control';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/equipment/training/training-acknowlegment-input.component';
import { CreateEquipmentProvisionForm } from 'src/app/equipment/provision/create-equipment-provision.form';

export type EquipmentLeaseForm = FormGroup<{
  equipment: FormControl<Equipment | NotFoundValue | null>;
  equipmentTrainingCompleted: FormControl<string[]>;
  requireSupervision: FormControl<boolean>;

  setupInstructions: FormControl<string>;
  usageCostEstimate: FormControl<number | null>;
}>;

function equipmentLeaseForm(
  lease: EquipmentLease | null,
): EquipmentLeaseForm {
  return new FormGroup({
    equipment: new FormControl<Equipment | NotFoundValue | null>(
      lease?.equipment || null,
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
    usageCostEstimate: new FormControl<number | null>(null)
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
    CreateEquipmentProvisionForm,
  ],
  template: `
  @if (form && funding) {
    <form [formGroup]="form">
      <equipment-search 
        formControlName="equipment" required
        allowNotFound
        [inLab]="lab$ | async"
      >
        <mat-label>Equipment</mat-label>
      </equipment-search>

      @if (newEquimentName$ | async; as newEquipmentName) {
        <equipment-create-equipment-provision-form
          [equipment]="{name: newEquipmentName}"
          [lab]="lab$ | async">
        </equipment-create-equipment-provision-form>
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

      @if (hasSelection$ | async; as equipment) {
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

  @Input()
  funding: ResearchFunding | null = null;

  readonly equipmentControl$ = this._formSubject.pipe(
    skipWhile(form => form == null),
    map(form => form!.controls.equipment)
  )

  createForm(committed: EquipmentLease | null) {
    return equipmentLeaseForm(committed);
  }

  async getPatch(patchParams: ResourceParams, value: EquipmentLeaseForm[ 'value' ]): Promise<EquipmentLeaseParams> {
    const equipmentProvision = this._createdProvisionSubject.value;

    let equipment: Equipment | EquipmentCreateRequest;
    if (value.equipment instanceof Equipment) {
      equipment = value.equipment;
    } else if (value.equipment instanceof NotFoundValue) {
      equipment = { name: value.equipment.searchInput };
    } else {
      throw new Error('Expected an equipment or NotFoundValue in form value');
    }

    return {
      ...patchParams,
      equipment,
      equipmentProvision,
      equipmentTrainingCompleted: new Set(value.equipmentTrainingCompleted!),
      requireSupervision: value.requireSupervision!,
      setupInstructions: value.setupInstructions!,
      usageCostEstimate: value.usageCostEstimate!
    };
  }

  readonly newEquimentName$ = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map(value => {
      if (value instanceof NotFoundValue) {
        return value.searchInput;
      }
      return null;
    })
  );

  readonly _createdProvisionSubject = new BehaviorSubject<EquipmentProvision | null>(null);
  readonly createdProvision$ = this._createdProvisionSubject.pipe(
    filter((p): p is EquipmentProvision => p != null),
  )
  readonly createdProvisionEquipment$ = this.createdProvision$.pipe(
    switchMap(provision => this._equipments.fetch(provision.equipmentId))
  );

  readonly selectedEquipmentTrainingDescriptions$: Observable<string[] | null> = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map((equipment) => {
      if (equipment instanceof Equipment) {
        return equipment.trainingDescriptions;
      }
      return null;
    }),
  );

  readonly hasSelection$ = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map(equipment => equipment != null)
  )
}
