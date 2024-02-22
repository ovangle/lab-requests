import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
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
import { Equipment, EquipmentUpdateRequest, EquipmentService, equipmentQueryToHttpParams } from './equipment';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { HttpParams } from '@angular/common/http';
import { Observable, debounceTime, firstValueFrom, map, shareReplay, switchMap } from 'rxjs';
import { EquipmentSearchComponent } from './equipment-search.component';
import { NotFoundValue } from '../common/model/search/search-control';
import { RouterModule } from '@angular/router';

export interface EquipmentFormControls {
  name: FormControl<Equipment | NotFoundValue | null>;
  description: FormControl<string>;
  tags: FormControl<string[]>;
  trainingDescriptions: FormControl<string[]>;
};

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
    <form [formGroup]="form!" (ngSubmit)="_onFormSubmit()">
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

      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" resizeOnInput>
        </textarea>
      </mat-form-field>

      <equipment-tags-input formControlName="tags">
        <mat-label>Tags</mat-label>
      </equipment-tags-input>

      <lab-equipment-training-descriptions-input
        formControlName="trainingDescriptions"
      >
      </lab-equipment-training-descriptions-input>

      <div class="form-actions">
        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="!form!.valid"
        >
          <mat-icon>save</mat-icon> save
        </button>
      </div>
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
export class EquipmentForm {
  readonly equipmentService = inject(EquipmentService);

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

  @Output()
  save = new EventEmitter<Equipment>();

  form = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
      asyncValidators: (control: AbstractControl<any>) => {
        return this._validateNameUnique(control as FormControl<string>);
      }
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    trainingDescriptions: new FormControl<string[]>(
      [],
      { nonNullable: true }
    ),
  });

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
    return this.form!.controls.name.errors;
  }
  readonly _matchEquipmentName: Observable<Equipment[]> = this.form.controls.name.valueChanges.pipe(
    debounceTime(300),
    switchMap(name => {
      return this.equipmentService.query({ name: name })
    }),
    shareReplay(1)
  );

  async _validateNameUnique(c: FormControl<string>): Promise<ValidationErrors | null> {
    if (this.equipment) {
      return null;
    }
    const nameMatches = await firstValueFrom(this._matchEquipmentName);
    if (nameMatches.length > 0) {
      return { unique: false };
    }
    return null;
  }

  get trainingDescripionsFormArr(): FormControl<string[]> {
    return this.form!.controls.trainingDescriptions;
  }

  async _doCreateEquipment(): Promise<Equipment> {
    if (!this.form.valid) {
      throw new Error('Invalid form has no value');
    }
    const value = this.form.value;
    const create = this.equipmentService.create({
      name: this.form.value.name!,
      description: value.description!,
      tags: value.tags!,
      trainingDescriptions: value.trainingDescriptions!
    });

    return firstValueFrom(create);
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
