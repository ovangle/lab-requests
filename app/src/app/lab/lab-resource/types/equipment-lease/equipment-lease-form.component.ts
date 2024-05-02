import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EquipmentLease, EquipmentLeaseParams, EquipmentLeasePatch, EquipmentLeaseService } from './equipment-lease';
import { BehaviorSubject, Observable, combineLatest, defer, filter, firstValueFrom, map, of, skipWhile, startWith, switchMap, tap } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { Equipment, EquipmentCreateRequest, EquipmentService } from 'src/app/equipment/equipment';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { NotFoundValue } from 'src/app/common/model/search/search-control';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/equipment/training/training-acknowlegment-input.component';
import { CreateEquipmentProvisionForm, createEquipmentProvisionForm } from 'src/app/equipment/provision/create-equipment-provision.form';
import { EquipmentProvision, EquipmentProvisionParams } from 'src/app/equipment/provision/equipment-provision';
import { Lab } from 'src/app/lab/lab';
import { injectMaybeLabFromContext } from 'src/app/lab/lab-context';
import { ResourceFormComponent } from '../../abstract-resource-form.component';
import { ResourceFormTitleComponent } from '../../common/resource-form-title.component';
import { EquipmentInstallation, EquipmentInstallationService } from 'src/app/equipment/installation/equipment-installation';
import { EquipmentInstallationInfoComponent } from 'src/app/equipment/installation/equipment-installation-info.component';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProvisionStatusPipe } from 'src/app/equipment/provision/provision-status.pipe';
import { EquipmentFormGroup, EquipmentNameUniqueValidator, equipmentFormGroup } from 'src/app/equipment/equipment-form.component';

export type EquipmentLeaseForm = FormGroup<{
  lab: FormControl<Lab>;
  equipment: FormControl<Equipment | NotFoundValue | null>;
  newEquipments: FormArray<EquipmentFormGroup>;
  equipmentProvisions: FormArray<any>;
  equipmentTrainingCompleted: FormControl<string[]>;
  requireSupervision: FormControl<boolean>;

  setupInstructions: FormControl<string>;
  usageCostEstimate: FormControl<number | null>;
}>;


@Component({
  selector: 'lab-equipment-lease-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,

    EquipmentSearchComponent,
    EquipmentInstallationInfoComponent,
    EquipmentTrainingAcknowlegementComponent,
    EquipmentRiskAssessmentFileInputComponent,
    CreateEquipmentProvisionForm,
    ResourceFormTitleComponent,
  ],
  template: `
  @if (form && funding) {
    @if (resourceIndex$ | async; as resourceIndex) {
      <lab-resource-form-title 
        resourceType="equipment_lease" 
        [resourceIndex]="resourceIndex"
        (requestClose)="close('close button click')"
        (requestSave)="saveAndClose()"
        [saveDisabled]="!form.valid" />
    }
    <form [formGroup]="form">
      <equipment-search 
        formControlName="equipment" required
        allowNotFound
        required
        [inLab]="lab!"
      >
        <mat-label>Equipment</mat-label>

        @if (equipmentErrors && equipmentErrors['required']) {
          <mat-error>A Value is required</mat-error>
        }
      </equipment-search>

      @if (isNewEquipment$ | async; as newEquipmentName) {
        <div formArrayName="newEquipments">
          @for (newEquipmentForm of newEquipments.controls; track newEquipmentForm) {
            <equipment-form formGroupName="$index" />
          }
        </div>
        
        <!--
        <equipment-create-equipment-provision-form
          [equipment]="{name: newEquipmentName}"
          [lab]="lab!">
        </equipment-create-equipment-provision-form>
        -->
      }

      @if (selectedEquipment$ | async; as equipment) {
        <div class="install-info">
          <equipment-installation-info [equipment]="equipment" [lab]="lab!"/>

          <button mat-button 
            [disabled]="hasAdditionalProvision$ | async"
            (click)="addAdditionalProvision()">
            + Request extra equipment
          </button>
        </div>

        <div formArrayName="equipmentProvisions">
          @for (city of equipmentProvisions.controls; track city) {
            <mat-card>
              <mat-card-header>Index: {{$index}}</mat-card-header>
              <mat-card-content>
                <equipment-create-equipment-provision-form
                  [equipment]="equipment"
                  [lab]="lab!"
                  [formGroupName]="$index" />
              </mat-card-content>
            </mat-card>
          }
        </div>
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

      <lab-equipment-risk-assessment-file-input />
    </form>
  }
  `,
  providers: [
    EquipmentContext,
    EquipmentInstallationService,
    EquipmentLeaseService
  ],
  styles: `
  .install-info {
    display: flex;
    justify-content: space-between;
  }
  `
})
export class EquipmentLeaseFormComponent extends ResourceFormComponent<EquipmentLease, EquipmentLeaseForm, EquipmentLeasePatch> {
  readonly resourceType = 'equipment_lease';
  readonly _equipmentContext = inject(EquipmentContext);
  readonly _equipments = inject(EquipmentService);
  readonly _equipmentNameUniqueValidator = inject(EquipmentNameUniqueValidator);
  readonly _equipmentInstallations = inject(EquipmentInstallationService);
  override readonly service = inject(EquipmentLeaseService);
  readonly _cd = inject(ChangeDetectorRef);

  @Input({ required: true })
  lab: Lab | undefined;

  @Input({ required: true })
  funding: ResearchFunding | null = null;


  readonly equipmentControl$ = this._formSubject.pipe(
    skipWhile(form => form == null),
    map(form => form!.controls.equipment)
  );

  readonly equipment$: Observable<Equipment | NotFoundValue | null> = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges)
  );

  get equipmentProvisions() {
    return this.form!.get('equipmentProvisions') as FormArray<any>;
  }

  constructor() {
    super();
    this.equipment$.pipe(
      takeUntilDestroyed()
    ).subscribe(equipment => {
      if (equipment instanceof Equipment) {
        this._equipmentContext.nextCommitted(equipment);
      }
      if (equipment instanceof NotFoundValue) {
        this.setEquipmentNotFound(equipment);
      }
    })

    /*
    this.selectedEquipment$.pipe(
      takeUntilDestroyed()
    ).subscribe(equipment => {
      if (equipment !== null) {
        this._equipmentContext.nextCommitted(equipment)
      }
    })
    */
  }

  createForm(lease: EquipmentLease | null) {
    return new FormGroup({
      lab: new FormControl<Lab>(
        this.lab!,
        {
          nonNullable: true,
          validators: Validators.required
        }
      ),
      equipment: new FormControl<Equipment | NotFoundValue | null>(
        lease?.equipment || null,
        { validators: [ Validators.required ] },
      ),
      newEquipments: new FormArray<EquipmentFormGroup>([]),
      equipmentProvisions: new FormArray<any>([]),
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

  readonly equipmentInstallation$: Observable<EquipmentInstallation | null> = this._formSubject.pipe(
    filter((form): form is EquipmentLeaseForm => form != null),
    switchMap(form => form.valueChanges),
    switchMap(value => {
      const equipment = value.equipment;
      if (equipment instanceof Equipment) {
        return this._equipmentInstallations.fetchForLabEquipment(this.lab!, equipment)
      }
      return of(null);
    })
  )

  readonly hasAdditionalProvision$ = this.form$.pipe(
    map(form => {
      const provisions = (form.value.equipmentProvisions || []);
      return provisions.length > 0;
    })
  );

  get equipmentErrors(): ValidationErrors | null {
    if (!this.form) {
      return null;
    }
    return this.form.controls[ 'equipment' ].errors;
  }

  async patchFromFormValue(value: EquipmentLeaseForm[ 'value' ]): Promise<EquipmentLeasePatch> {
    let equipment: Equipment | EquipmentCreateRequest;
    if (value.equipment instanceof Equipment) {
      equipment = value.equipment;
    } else if (value.equipment instanceof NotFoundValue) {
      equipment = { name: value.equipment.searchInput };
    } else {
      throw new Error('Expected an equipment or NotFoundValue in form value');
    }

    let lab = value.lab;
    if (!lab) {
      throw new Error('Lab uninitialized on form');
    }

    let equipmentInstallation: EquipmentInstallation | null = null;
    if (value.equipment instanceof NotFoundValue) {
      equipmentInstallation = null;
    } else if (value.equipment instanceof Equipment) {
      const _fetchInstall = this._equipmentInstallations.fetchForLabEquipment(lab, value.equipment!);
      equipmentInstallation = await firstValueFrom(_fetchInstall);
    }


    let equipmentProvision: EquipmentProvision | null = null;
    if (value.equipment instanceof NotFoundValue) {

    }

    return {
      equipment,
      equipmentProvision,
      equipmentTrainingCompleted: new Set(value.equipmentTrainingCompleted!),
      requireSupervision: value.requireSupervision!,
      setupInstructions: value.setupInstructions!,
      usageCostEstimate: value.usageCostEstimate!
    } as any;
  }

  readonly isNewEquipment$ = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map(value => value instanceof NotFoundValue)
  );
  get newEquipments() {
    return this.form!.controls.newEquipments;
  }

  readonly selectedEquipment$ = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map(value => {
      if (value instanceof Equipment) {
        return value;
      }
      return null;
    })
  )

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

  setEquipmentNotFound(notFoundValue: NotFoundValue) {
    const newEquipments: FormArray<EquipmentFormGroup> = this.form!.controls.newEquipments;
    let formGroup: EquipmentFormGroup;
    if (newEquipments.length < 1) {
      formGroup = equipmentFormGroup(this._equipmentNameUniqueValidator);
      newEquipments.push(formGroup);
    } else {
      formGroup = newEquipments.controls[ 0 ];
    }
    formGroup.patchValue({ name: notFoundValue.searchInput });
    this._cd.detectChanges();
  }

  addAdditionalProvision() {
    const equipmentProvisions: FormArray<any> = this.form!.controls.equipmentProvisions;
    equipmentProvisions.push(
      createEquipmentProvisionForm(this.lab)
    );
    this._cd.detectChanges();
  }
}
