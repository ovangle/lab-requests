import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  Injectable,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ControlContainer,
  FormArray,
  FormBuilder,
  FormControl,
  FormControlStatus,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { EquipmentTagInputComponent } from './tag/equipment-tag-input.component';
import { EquipmentTrainingDescriptionsFieldHint, EquipmentTrainingDescriptionsInputComponent } from './training/training-descriptions-input.component';
import { EquipmentService, EquipmentCreateRequest, Equipment } from './equipment';
import { EquipmentSearchComponent } from './equipment-search.component';
import { RouterModule } from '@angular/router';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Discipline } from '../uni/discipline/discipline';
import { UniDisciplineSelect } from '../uni/discipline/discipline-select.component';
import { EquipmentNameUniqueValidator } from './equipment-name-unique-validator';
import { EquipmentInstallationFormComponent, EquipmentInstallationFormGroup, equipmentInstallationFormGroupFactory } from './installation/equipment-installation-form.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, startWith, switchMap } from 'rxjs';
import { EquipmentInstallation } from './installation/equipment-installation';
import { LabService } from '../lab/lab';
import { ThisReceiver } from '@angular/compiler';
import { modelId } from '../common/model/model';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AbstractModelForm, ModelFormActionsComponent } from '../common/model/forms/abstract-model-form.component';
import { MatCardModule } from '@angular/material/card';
import { SoftwareFormComponent } from '../software/software-form.component';

function equipmentFormGroupFactory() {
  const fb = inject(FormBuilder);
  const equipmentNameUnique = inject(EquipmentNameUniqueValidator);

  return () => fb.group({
    name: fb.control('', {
      validators: [Validators.required],
      asyncValidators: [(c) => equipmentNameUnique.validate(c)]
    }),
    description: fb.control<string>('', { nonNullable: true }),
    isAnyDiscipline: fb.control<boolean>(false, { nonNullable: true}),
    disciplines: fb.control<string[]>([], { nonNullable: true }),
    tags: fb.control<string[]>([], { nonNullable: true }),
    trainingDescriptions: fb.control<string[]>([], { nonNullable: true }),
    installations: fb.array<EquipmentInstallationFormGroup>([]),
    hasPackagedSoftware: fb.control<boolean>(false, { nonNullable: true})
  });
}

export type EquipmentFormGroup = ReturnType<ReturnType<typeof equipmentFormGroupFactory>>;

/**
 * Nested form describing basic info about a piece of equipment.
 */
@Component({
  selector: 'equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    UniDisciplineSelect,
    EquipmentSearchComponent,
    EquipmentTagInputComponent,
    EquipmentTrainingDescriptionsInputComponent,
    EquipmentTrainingDescriptionsFieldHint,

    EquipmentInstallationFormComponent,
    ModelFormActionsComponent,

    SoftwareFormComponent
],
  template: `
    <form [formGroup]="form">
        <div class="equipment-form">
            <h4>General</h4>
            <mat-form-field>
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" required>

                @if (nameErrors && nameErrors['required']) {
                    <mat-error>A value is required</mat-error>
                }
                @if (nameErrors && nameErrors['unique']) {
                <mat-error>
                    Equipment name must be unqiue.
                </mat-error>
                }
            </mat-form-field>

            <mat-form-field>
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" cdkTextareaAutosize>
                </textarea>
            </mat-form-field>

            <div class="any-discipline">
            </div>

            <div class="any-discipline-check">
              <mat-checkbox formControlName="isAnyDiscipline">Equipment can be used by labs from any discipline</mat-checkbox>
            </div>

            <mat-form-field>
              <mat-label>Disciplines</mat-label>
              <uni-discipline-select multiple formControlName="disciplines"/>
            </mat-form-field>

            <mat-form-field>
                <mat-label>Tags</mat-label>
                <equipment-tags-input formControlName="tags" />
            </mat-form-field>

            <mat-form-field>
                <mat-label>Training descriptions</mat-label>
                <equipment-training-descriptions-input formControlName="trainingDescriptions" />
                <mat-hint>
                    <equipment-training-descriptions-hint />
                </mat-hint>
            </mat-form-field>

            <div class="has-packaged-software">
              <mat-checkbox formControlName="hasPackagedSoftware">
                This equipment comes with packaged software
              </mat-checkbox>
            </div>

            @if (form.value.hasPackagedSoftware) {
              <h4>Packaged software</h4>
              <software-form formGroupName="packagedSoftware"
                             [software]="equipment()?.packagedSoftware" />
            }
        </div>

        @if (!hideInstallations()) {
          <div class="installations">
              <div class="installations-header">
                  <h4>Installations</h4>

                  <button mat-icon-button (click)="_onAddInstallationButtonClick($event)">
                      <mat-icon>add</mat-icon>
                  </button>
              </div>

              @let formArray = form.controls.installations;

              @if (formArray.length == 0) {
                  No installations
              } @else {
                  @for (installForm of formArray.controls; track installForm) {
                    <mat-card>
                      <mat-card-content>
                        <equipment-installation-form [formGroup]="installForm"
                                                     [equipment]="equipment() || form['value']"/>
                      </mat-card-content>
                    </mat-card>
                  }
              }
          </div>
        }

        <model-form-actions />
    </form>
  `,
  styles:
    `
    .form-actions button {
      float: right;
    }

    .installations-header {
      display: flex;
      justify-content: space-between;
    }
  `,
  viewProviders: [
    {provide: AbstractModelForm, useExisting: EquipmentFormComponent}
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentFormComponent extends AbstractModelForm<EquipmentFormGroup> {
  protected readonly _cd  = inject(ChangeDetectorRef);
  readonly equipmentService = inject(EquipmentService);
  readonly labService = inject(LabService);


  readonly controlContainer = inject(ControlContainer, { self: true, optional: true });
  readonly _createStandaloneForm = equipmentFormGroupFactory();
  readonly _createEquipmentInstallationFormGroup = equipmentInstallationFormGroupFactory()

  readonly equipment = input<Equipment | null>();
  readonly isUpdateForm = computed(() => this.equipment() != null);

  _hideInstallations = input(false, { transform: coerceBooleanProperty, alias: 'hideInstallations' });
  hideInstallations = computed(() => {
    const directHideInstallations = this._hideInstallations();
    const isUpdate = this.isUpdateForm();

    return directHideInstallations || isUpdate;
  })

  constructor() {
    super();
    const syncFormValue = toObservable(this.equipment).pipe(
      switchMap(async equipment => {
        if (equipment) {
          this.form.patchValue({
            name: equipment.name,
            description: equipment.description,
            trainingDescriptions: equipment.trainingDescriptions,
            isAnyDiscipline: equipment.disciplines === 'any',
            disciplines: equipment.disciplines === 'any' ? [] : equipment.disciplines,
            tags: equipment.tags,
          });

          // Ensure that we cache labs for all the installations.
          const labIds = equipment.installations.items.map(install => install.labId);
          await firstValueFrom(this.labService.fetchAll(labIds));

          const _syncInstallationFormValue = async (f: EquipmentInstallationFormGroup, install: EquipmentInstallation) => {
            const lab = await firstValueFrom(this.labService.fetch(install.labId));

            f.setValue({
              equipment: equipment!,
              lab,
              numInstalled: install.numInstalled,
              modelName: install.installedModelName,
            })
          }

          const installationFormArr = this.form.controls.installations;
          const seenInstallIds = new Set();
          for (const control of installationFormArr.controls) {
            const lab = control.value.lab;
            if (lab) {
              const installAtLab = equipment.installations.items.find(
                i => i.labId == modelId(lab)
              );
              if (installAtLab) {
                seenInstallIds.add(installAtLab.id);
                await _syncInstallationFormValue(control, installAtLab)
                continue
              }
            }
          }

          for (const install of equipment.installations.items) {
            if (seenInstallIds.has(install.id)) {
              continue;
            }

            let populatedEmptyLabForm = false
            for (const control of installationFormArr.controls) {
              if (control.value.lab == null) {
                await _syncInstallationFormValue(control, install);
                populatedEmptyLabForm = true;
                continue;
              }
            }

            if (!populatedEmptyLabForm) {
              const control = this.addInstallationForm();
              await _syncInstallationFormValue(control, install);
            }
          }
        }
      })
    ).subscribe();

    const syncDisciplines = this.form.controls.isAnyDiscipline.valueChanges.pipe(
      startWith(this.form.value.isAnyDiscipline)
    ). subscribe(isAnyDiscipline => {
      const disciplines = this.form.controls.disciplines;
      if (isAnyDiscipline) {
        disciplines.disable();
      } else {
        disciplines.enable();
      }
    })


    inject(DestroyRef).onDestroy(() => {
      syncFormValue.unsubscribe();
      syncDisciplines.unsubscribe();
    })

  }

  get nameErrors(): ValidationErrors | null {
    return this.form.controls.name.errors;
  }

  addInstallationForm() {
    const formArr = this.form.controls.installations;
    const form = this._createEquipmentInstallationFormGroup();
    formArr.push(form);
    this._cd.detectChanges();
    return form;
  }

  _onAddInstallationButtonClick(event: Event) {
    event.preventDefault();
    this.addInstallationForm();
  }
}
