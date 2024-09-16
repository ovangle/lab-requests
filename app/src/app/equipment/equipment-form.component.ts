import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
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
import { EquipmentInstallationFormGroup, equipmentInstallationFormGroupFactory } from './installation/equipment-installation-form.component';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { EquipmentInstallation } from './installation/equipment-installation';

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
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,

    UniDisciplineSelect,
    EquipmentSearchComponent,
    EquipmentTagInputComponent,
    EquipmentTrainingDescriptionsInputComponent,
    EquipmentTrainingDescriptionsFieldHint
  ],
  template: `
    <form [formGroup]="formGroup" (ngSubmit)="_onFormSubmit()">

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

            <mat-form-field>
                <mat-label>Disciplines</mat-label>
                <uni-discipline-select multiple formControlName="disciplines"/>
                <mat-hint>
                <i>Only</i> used in research/teaching in the given discipline.
                Multiple disciplines can be selected.
                </mat-hint>
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
        </div>

        <div class="installations">
            <div class="installations-header">
                <h4>Installations</h4>

                <button mat-icon-button (click)="addInstallationForm()">
                    <mat-icon>add</mat-icon>
                </button>
            </div>

            @let formArray = formGroup.controls.installations;

            @if (formArray.length == 0) {
                No installations
            } @else {
                @for (form of formArray.controls; track form) {
                    <equipment-installation-form [formGroup]="form" />
                }
            }
        </div>
        <div class="form-controls">
            <button mat-raised-button type="submit" [disabled]="!formGroup.valid">
                <mat-icon>save</mat-icon> SAVE
            </button>
            <button mat-button (click)="_onCancelButtonClick()">
                <mat-icon>cancel</mat-icon> CANCEL
            </button>
        </div>
    </form>
  `,
  styles:
    `
    .form-actions button {
      float: right;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentFormComponent {
  readonly equipmentService = inject(EquipmentService);

  readonly controlContainer = inject(ControlContainer, { self: true });
  readonly _equipmentNameUnique = inject(EquipmentNameUniqueValidator);
  readonly _createEquipmentInstallationFormGroup = equipmentInstallationFormGroupFactory()
  readonly _fb = inject(FormBuilder);

  readonly formGroup = this._fb.group({
    name: this._fb.control('', {
      validators: [Validators.required],
      asyncValidators: [(c) => this._equipmentNameUnique.validate(c)]
    }),
    description: this._fb.control<string>('', { nonNullable: true }),
    disciplines: this._fb.control<string[]>([], { nonNullable: true }),
    tags: this._fb.control<string[]>([], { nonNullable: true }),
    trainingDescriptions: this._fb.control<string[]>([], { nonNullable: true }),
    installations: this._fb.array<EquipmentInstallationFormGroup>([])

  });

  readonly equipment = input<Equipment>();
  readonly isUpdateForm = computed(() => this.equipment() != null);

  @Output()
  readonly submit = new EventEmitter<EquipmentCreateRequest>();
  @Output()
  readonly cancel = new EventEmitter<void>();

  constructor() {
    const syncFormValue = toObservable(this.equipment).pipe(
      switchMap(async equipment => {
        if (equipment) {
          this.formGroup.setValue({
            name: equipment.name,
            description: equipment.description,
            trainingDescriptions: equipment.trainingDescriptions,
            disciplines: equipment.disciplines,
            tags: equipment.tags,
            installations: []
          });

          for (const install of equipment.installations.items) {
            await this.addInstallationForm(install);
          }

        }
      })
    ).subscribe();

    inject(DestroyRef).onDestroy(() => {
      syncFormValue.unsubscribe();
    })

  }

  get nameErrors(): ValidationErrors | null {
    return this.formGroup.controls.name.errors;
  }

  async addInstallationForm(installation?: EquipmentInstallation) {
    const formArr = this.formGroup.controls.installations;
    const form = await this._createEquipmentInstallationFormGroup(installation);
    formArr.push(form);
  }

  _onAddInstallationButtonClick() {
    this.addInstallationForm();
  }


  _onFormSubmit() {
    const value = this.formGroup.value;

    const request: EquipmentCreateRequest = {
      name: value!.name!,
      description: value!.description,
      trainingDescriptions: value!.trainingDescriptions,
      installations: value.installations!.map(
        installation => ({
          modelName: installation.modelName!,
          lab: installation.lab!.id,
          numInstalled: installation.numInstalled!,
        })
      )
    };
    this.submit.emit(request);
  }

  _onCancelButtonClick() {
    this.cancel.emit(undefined);
  }
}
