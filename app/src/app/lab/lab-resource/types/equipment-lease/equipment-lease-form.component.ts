import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, inject } from '@angular/core';
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
import { BehaviorSubject, Observable, combineLatest, defer, distinctUntilChanged, filter, firstValueFrom, map, of, shareReplay, skipWhile, startWith, switchMap, tap, withLatestFrom } from 'rxjs';
import { EquipmentSearchComponent } from 'src/app/equipment/equipment-search.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { EquipmentRiskAssessmentFileInputComponent } from './risk-assessment-file-input.component';
import { Equipment, EquipmentCreateRequest, EquipmentService } from 'src/app/equipment/equipment';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { NotFoundValue } from 'src/app/common/model/search/search-control';
import { EquipmentTrainingAcknowlegementComponent } from 'src/app/equipment/training/training-acknowlegment-input.component';
import { CreateEquipmentProvisionRequest, EquipmentProvision } from 'src/app/equipment/provision/equipment-provision';
import { Lab } from 'src/app/lab/lab';
import { ResourceFormComponent } from '../../abstract-resource-form.component';
import { ResourceFormTitleComponent } from '../../common/resource-form-title.component';
import { EquipmentInstallation, EquipmentInstallationService } from 'src/app/equipment/installation/equipment-installation';
import { EquipmentInstallationInfoComponent } from 'src/app/equipment/installation/equipment-installation-info.component';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { EquipmentFormComponent, EquipmentFormGroup, EquipmentNameUniqueValidator, equipmentCreateRequestFromForm, equipmentFormGroup } from 'src/app/equipment/equipment-form.component';
import { EquipmentProvisionCreateFormComponent, EquipmentProvisionCreateFormGroup, equipmentProvisionCreateFormGroup, equipmentProvisionCreateRequestFromForm } from 'src/app/equipment/provision/equipment-create-provision-form.component';
import { CreateEquipmentProvisionFormComponent } from 'src/app/equipment/provision/create-equipment-provision.form';
import { MatIconModule } from '@angular/material/icon';
import { modelId } from 'src/app/common/model/model';

export type EquipmentLeaseForm = FormGroup<{
  equipment: FormControl<Equipment | NotFoundValue | null>;
  newEquipments: FormArray<EquipmentFormGroup>;
  equipmentProvisions: FormArray<EquipmentProvisionCreateFormGroup>;
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
    MatIconModule,
    MatInputModule,

    EquipmentFormComponent,
    EquipmentSearchComponent,
    EquipmentInstallationInfoComponent,
    EquipmentTrainingAcknowlegementComponent,
    EquipmentRiskAssessmentFileInputComponent,
    EquipmentProvisionCreateFormComponent,
    ResourceFormTitleComponent,
  ],
  template: `
  <!--
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
        formControlName="equipment"
        allowNotFound
        required
        [inLab]="lab!"
      >
        <mat-label>Equipment</mat-label>

        @if (equipmentErrors && equipmentErrors['required']) {
          <mat-error>A Value is required</mat-error>
        }
      </equipment-search>

      @if (isNewEquipment$ | async) {
        <div formArrayName="newEquipments">
          @for (_ of newEquipments.controls; track _) {
            <mat-card>
              <mat-card-header>New equipment type</mat-card-header>
              <mat-card-content>
                <equipment-form [formGroupName]="$index" 
                                [disableFields]="['tags', 'trainingDescriptions']" />
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      @if (selectedEquipment$ | async; as equipment) {
        @if (selectedEquipmentInstallation$ | async; as equipmentInstallation) {
        <div class="install-info">
          <equipment-installation-info [installation]="equipmentInstallation">

          @if (hasAdditionalProvision$ | async) {
            <button mat-button
              (click)="clearAdditionalProvision()">
                <mat-icon>close</mat-icon>Cancel
            </button>
          <button mat-button 
            [disabled]="hasAdditionalProvision$ | async"
            (click)="addAdditionalProvision()">
            + Request extra equipment
          </button>
          } @else {
            
          }
        </div>
        }
      }

      @if (effectiveEquipment$ | async; as equipment) {
        <div class="equipment-provisions" formArrayName="equipmentProvisions">
          @for (_ of equipmentProvisions.controls; track _) {
            <mat-card>
              <mat-card-header>Provisioning</mat-card-header>
              <mat-card-content>
                <equipment-provision-create-form
                  [equipment]="equipment"
                  [lab]="lab!"
                  [formGroupName]="$index" />
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      @if (effectiveEquipment$ | async; as equipment) {
        <mat-card>
          <mat-card-header>Training/competency</mat-card-header>
          <mat-card-content>
            @if (selectedEquipmentTrainingDescriptions$ | async; as trainingDescriptions) {
              <lab-equipment-training-acknowledgement
                [trainingDescriptions]="trainingDescriptions"
                formControlName="equipmentTrainingCompleted"
              />
            }

            <mat-checkbox formControlName="requireSupervision">
              I require additional assistance using this equipment
            </mat-checkbox>
          </mat-card-content>
        </mat-card>

        <lab-equipment-risk-assessment-file-input />
      }
    </form>
  }
-->
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

  get equipmentProvisions(): FormArray<EquipmentProvisionCreateFormGroup> {
    return this.form!.controls.equipmentProvisions;
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
    });
    this.createEquipmentRequest$.subscribe((request) => {
      console.log('create equipment request', request)
    });
  }

  createForm(lease: EquipmentLease | null) {
    return new FormGroup({
      equipment: new FormControl<Equipment | NotFoundValue | null>(
        lease?.equipment || null,
        { validators: [Validators.required] },
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
    switchMap(form => {
      const provisions = (form.value.equipmentProvisions || []);
      return form.valueChanges.pipe(
        map(() => provisions.length > 0),
        tap((hasProvisions) => console.log('has additional provisions', hasProvisions))
      );
    })
  );

  get equipmentErrors(): ValidationErrors | null {
    if (!this.form) {
      return null;
    }
    return this.form.controls['equipment'].errors;
  }

  async patchFromFormValue(value: EquipmentLeaseForm['value']): Promise<EquipmentLeasePatch> {
    let equipment: Equipment | EquipmentCreateRequest;
    if (value.equipment instanceof Equipment) {
      equipment = value.equipment;
    } else if (value.equipment instanceof NotFoundValue) {
      if (this.newEquipments.controls.length === 0) {
        throw new Error('No new equipment submform')
      }
      const newEquipmentSubform = this.newEquipments.controls[0];
      equipment = equipmentCreateRequestFromForm(newEquipmentSubform);
    } else {
      throw new Error('Expected an equipment or NotFoundValue in form value');
    }

    let equipmentProvision: CreateEquipmentProvisionRequest | null = null;
    if (this.equipmentProvisions.length > 0) {
      const equipmentProvisionControl = this.equipmentProvisions.controls[0];
      equipmentProvision = equipmentProvisionCreateRequestFromForm(
        equipment,
        this.lab!,
        equipmentProvisionControl
      );
    }

    return {
      lab: this.lab!,
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

  /**
   * The existing equipment which was selected via the equipment control
   */
  readonly selectedEquipment$: Observable<Equipment | null> = this.equipmentControl$.pipe(
    switchMap(control => control.valueChanges),
    map(value => {
      if (value instanceof Equipment) {
        return value;
      }
      return null;
    })
  )

  /**
   * The CreateEquipmentRequest which is associated with selecting 'not found'
   * from equipment control.
   */
  readonly createEquipmentRequest$: Observable<EquipmentCreateRequest> = this.form$.pipe(
    map(f => f.controls.newEquipments),
    switchMap((control) => {
      return control.valueChanges.pipe(
        map(_ => control.length >= 1 ? control.controls[0] : null),
        filter((f): f is EquipmentFormGroup => f != null && f.valid),
        distinctUntilChanged(),
      )
    }),
    tap(c => console.log('create equipment form 2', c)),
    map(f => equipmentCreateRequestFromForm(f)),
    shareReplay(1)
  );

  readonly effectiveEquipment$: Observable<Equipment | EquipmentCreateRequest | null> = combineLatest([
    this.selectedEquipment$,
    this.createEquipmentRequest$.pipe(startWith(null))
  ]).pipe(
    map(([selected, createRequest]) => {
      console.log('selected', selected, 'createRequest', createRequest);
      return selected || createRequest || null;
    })
  );

  readonly _createdProvisionSubject = new BehaviorSubject<EquipmentProvision | null>(null);
  readonly createdProvision$ = this._createdProvisionSubject.pipe(
    filter((p): p is EquipmentProvision => p != null),
  )
  readonly createdProvisionEquipment$ = this.createdProvision$.pipe(
    switchMap(provision => this._equipments.fetch(modelId(provision.target)))
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
    map(equipment => equipment != null),
  )

  readonly isCreatingEquipment$ = this.form$.pipe(
    map(f => f.controls.newEquipments),
    map(control => control.length >= 1)
  );


  setEquipmentNotFound(notFoundValue: NotFoundValue) {
    const equipments = this.form!.controls.equipment;
    equipments.disable({ emitEvent: false });

    const newEquipments: FormArray<EquipmentFormGroup> = this.form!.controls.newEquipments;
    let formGroup: EquipmentFormGroup;
    if (newEquipments.length < 1) {
      formGroup = equipmentFormGroup(this._equipmentNameUniqueValidator);
      newEquipments.push(formGroup);
    } else {
      formGroup = newEquipments.controls[0];
    }
    formGroup.patchValue({ name: notFoundValue.searchInput });
    this.addAdditionalProvision();
    this._cd.detectChanges();
  }
  clearEquipmentNotFound() {
    const equipments = this.form!.controls.equipment;
    equipments.enable({ emitEvent: false });

    if (this.newEquipments.length > 0) {
      this.newEquipments.clear();
    }
    this.clearAdditionalProvision();
    this._cd.detectChanges();
  }

  addAdditionalProvision() {
    const equipmentProvisions: FormArray<any> = this.form!.controls.equipmentProvisions;
    if (equipmentProvisions.length < 1) {
      equipmentProvisions.push(
        equipmentProvisionCreateFormGroup()
      );
      this._cd.detectChanges();
    }
  }

  clearAdditionalProvision() {
    if (this.equipmentProvisions.length >= 0) {
      this.equipmentProvisions.clear();
    }
    this._cd.detectChanges();
  }
}
