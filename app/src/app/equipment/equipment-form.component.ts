import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  ControlContainer,
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
import { EquipmentTrainingDescriptionsInputComponent } from './training/training-descriptions-input.component';
import { Equipment, EquipmentUpdateRequest, EquipmentService, equipmentQueryToHttpParams, EquipmentCreateRequest } from './equipment';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, debounceTime, distinctUntilChanged, firstValueFrom, map, of, shareReplay, switchMap } from 'rxjs';
import { EquipmentSearchComponent } from './equipment-search.component';
import { NotFoundValue } from '../common/model/search/search-control';
import { RouterModule } from '@angular/router';

export interface EquipmentFormControls {
  name: FormControl<string>;
  description: FormControl<string>;
  tags: FormControl<string[]>;
  trainingDescriptions: FormControl<string[]>;
};

@Injectable({ providedIn: 'root' })
export class EquipmentNameUniqueValidator implements AsyncValidator {
  readonly equipments = inject(EquipmentService);
  readonly valueSubject = new BehaviorSubject<string>('');

  readonly matches = this.valueSubject.pipe(
    distinctUntilChanged(),
    debounceTime(300),
    switchMap(value => this.equipments.query({ name: value })),
    shareReplay(1)
  );

  async validate(control: AbstractControl<any, any>): Promise<ValidationErrors | null> {
    const value = control.value;
    if (typeof value === 'string') {
      this.valueSubject.next(value);
    }
    const matches = await firstValueFrom(this.matches);
    if (matches.length > 0) {
      return { unique: 'equipment name not unqiue' };
    }
    return null;
  }
}

export type EquipmentFormGroup = FormGroup<EquipmentFormControls>;
export function equipmentFormGroup(validateNameUnique: EquipmentNameUniqueValidator): EquipmentFormGroup {
  return new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
      asyncValidators: [
        (c) => validateNameUnique.validate(c)
      ]
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    trainingDescriptions: new FormControl<string[]>(
      [],
      { nonNullable: true }
    ),
  });
}

export function equipmentCreateRequestFromForm(form: EquipmentFormGroup): EquipmentCreateRequest {
  if (!form.valid) {
    throw new Error('Invalid form has no value');
  }
  return {
    name: form.value.name!,
    description: form.value.description,
    tags: form.value.tags,
    trainingDescriptions: form.value.trainingDescriptions
  };

}

@Component({
  selector: 'equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,

    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,

    ResizeTextareaOnInputDirective,
    EquipmentSearchComponent,
    EquipmentTagInputComponent,
    EquipmentTrainingDescriptionsInputComponent,
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="_onFormSubmit()">
      @if (!equipment) {
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
      }

      @if (!_disableFields.has('description')) {
        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" resizeOnInput>
          </textarea>
        </mat-form-field>
      }

      @if (!_disableFields.has('tags')) {
        <equipment-tags-input formControlName="tags">
          <mat-label>Tags</mat-label>
        </equipment-tags-input>
      }

      @if (!_disableFields.has('trainingDescriptions')) {
        <lab-equipment-training-descriptions-input
          formControlName="trainingDescriptions"
        >
        </lab-equipment-training-descriptions-input>
      }

      @if (_isStandaloneForm) {
        <div class="form-actions">
          <button
            mat-raised-button
            type="submit"
            color="primary"
            [disabled]="!form.valid"
          >
            <mat-icon>save</mat-icon> save
          </button>
        </div>
      }
    </form>
  `,
  styles: [
    `
      .form-actions button {
        float: right;
      }
    `,
  ],
  exportAs: 'form',
})
export class EquipmentFormComponent {
  readonly equipmentService = inject(EquipmentService);
  readonly _validateNameUnique = inject(EquipmentNameUniqueValidator);
  readonly _controlContainer = inject(ControlContainer, { optional: true });

  get form(): EquipmentFormGroup {
    if (this._form === undefined) {
      if (this._controlContainer) {
        this._form = this._controlContainer.control as EquipmentFormGroup;
      } else {
        this._form = equipmentFormGroup(this._validateNameUnique);
        this._isStandaloneForm = true;
      }
      this._formStatusSubscription = this._form.statusChanges.subscribe(status => {
        this.formStatus.emit(status)
      });
    }
    return this._form;
  }
  _isStandaloneForm: boolean = false;
  _form: EquipmentFormGroup | undefined;
  _formStatusSubscription: Subscription | undefined;

  @Input()
  get equipment() {
    return this._equipment;
  }
  set equipment(equipment: Equipment | null) {
    this._equipment = equipment;
    if (equipment) {
      this.form.patchValue({
        name: equipment.name,
        description: equipment.description,
        tags: equipment.tags,
        trainingDescriptions: []
      })
    } else {
      this.form.reset();
    }
  }
  _equipment: Equipment | null = null;

  @Input()
  get disableFields() {
    return [ ...this._disableFields ];
  }
  set disableFields(value: (keyof EquipmentFormGroup[ 'controls' ])[]) {
    this._disableFields = new Set(value);

    if (this._disableFields.has('name')) {
      throw new Error('Cannot disable name field of equipment form');
    }
  }

  _disableFields = new Set<keyof EquipmentFormGroup[ 'controls' ]>();

  /**
   * Fired when the model is saved. Only active if standalone form.
   */
  @Output()
  save = new EventEmitter<Equipment>();

  @Output()
  readonly formStatus = new EventEmitter<FormControlStatus>();


  get currentPatch(): EquipmentUpdateRequest | null {
    if (!this.form.valid) {
      return null;
    }
    return {
      description: this.form.value.description!,
      tags: this.form.value.tags!,
      trainingDescriptions: this.form.value.trainingDescriptions!
    }
  }

  get nameErrors(): ValidationErrors | null {
    return this.form.controls.name.errors;
  }

  get trainingDescripionsFormArr(): FormControl<string[]> {
    return this.form.controls.trainingDescriptions;
  }

  ngOnDestroy() {
    if (this._formStatusSubscription) {
      this._formStatusSubscription.unsubscribe();
    }
  }

  async _doCreateEquipment(): Promise<Equipment> {
    const request = equipmentCreateRequestFromForm(this.form);
    return firstValueFrom(this.equipmentService.create(request));
  }

  async _doUpdateEquipment(equipment: Equipment): Promise<Equipment> {
    const value = this.form.value;
    const update = this.equipmentService.update(equipment, {
      description: value.description!,
      tags: value.tags!,
      trainingDescriptions: value.trainingDescriptions!
    });
    return firstValueFrom(update);
  }

  async _onFormSubmit() {
    let equipment: Equipment;
    if (!this.equipment) {
      equipment = await this._doCreateEquipment();
    } else {
      equipment = await this._doUpdateEquipment(this.equipment);
    }
    this.save.emit(equipment);
  }

  _descriptionTextareaHeightPx = 60;
  _onDescriptionInput(evt: Event) {
    this._descriptionTextareaHeightPx = (evt.target as Element).scrollHeight;
  }
}
