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
import { Equipment, EquipmentPatch, EquipmentService } from './equipment';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom, map } from 'rxjs';
import { EquipmentSearchComponent } from './equipment-search.component';
import { NotFoundValue } from '../common/model/search/search-control';

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
    <form [formGroup]="form!" (ngSubmit)="commitForm($event)">
      @if (!equipment) {
        <equipment-search [inLab]="null" 
          required
          allowNotFound 
          formControlName="equipment">
          <mat-label>Name</mat-label>

          @if (nameErrors && nameErrors['required']) {
            <mat-error>A value is required</mat-error>
          }

        </equipment-search>
      }
      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description" resizeOnInput>
        </textarea>
      </mat-form-field>

      <lab-equipment-tags-input formControlName="tags">
        <mat-label>Tags</mat-label>
      </lab-equipment-tags-input>

      <lab-equipment-training-descriptions-input
        formControlName="trainingDescriptions"
      >
      </lab-equipment-training-descriptions-input>

      <div class="form-actions">
        <button
          mat-raised-button
          type="submit"
          color="primary"
          [disabled]="form!.invalid"
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
    if (this.form.value.equipment instanceof Equipment) {
      return this.form.value.equipment;
    }
    return null;
  }
  set equipment(equipment: Equipment | null) {
    if (equipment) {
      this.form.patchValue({ equipment });
    }
  }

  get isNewEquipment() {
    return this.form.value.equipment instanceof NotFoundValue;
  }

  @Output()
  save = new EventEmitter<Equipment>();

  readonly form = new FormGroup({
    equipment: new FormControl<Equipment | NotFoundValue | null>(null, {
      validators: [ Validators.required, equipmentNameRequiredValidator ],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    trainingDescriptions: new FormControl<string[]>([], { nonNullable: true }),
  });

  get currentPatch(): EquipmentPatch | null {
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
    return this.form!.controls.equipment.errors;
  }

  get trainingDescripionsFormArr(): FormControl<string[]> {
    return this.form!.controls.trainingDescriptions;
  }

  async _doCreateEquipment(name: string): Promise<Equipment> {
    if (!this.form.valid) {
      throw new Error('Invalid form has no value');
    }
    const value = this.form.value;
    const create = this.equipmentService.create({
      name: name,
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

  async commitForm(evt: Event) {
    const formEquipment = this.form.value.equipment;
    let equipment: Equipment;
    if (formEquipment instanceof NotFoundValue) {
      const equipmentName = formEquipment.searchInput;
      equipment = await this._doCreateEquipment(equipmentName);
    } else if (formEquipment instanceof Equipment) {
      equipment = await this._doUpdateEquipment(formEquipment);
    } else {
      throw new Error('Expected an Equipment or NotFoundValue');
    }
    this.save.emit(equipment);
  }

  _descriptionTextareaHeightPx = 60;
  _onDescriptionInput(evt: Event) {
    this._descriptionTextareaHeightPx = (evt.target as Element).scrollHeight;
  }
}

function equipmentNameRequiredValidator(control: AbstractControl<Equipment | NotFoundValue | null>) {
  if (control.value instanceof NotFoundValue) {
    if (control.value.searchInput.trim() == '') {
      return { 'required': true };
    }
  }
  return null;
}