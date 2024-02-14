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
import { EquipmentTagInputComponent } from '../lab/equipment/tag/equipment-tag-input.component';
import { EquipmentTrainingDescriptionsInputComponent } from '../lab/equipment/training/training-descriptions-input.component';
import { Equipment, EquipmentPatch, EquipmentService } from './equipment';
import { ResizeTextareaOnInputDirective } from 'src/app/common/forms/resize-textarea-on-input.directive';
import { EquipmentContext } from 'src/app/equipment/equipment-context';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export const equipmentFixtures: Equipment[] = [];

export type EquipmentForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  tags: FormControl<string[]>;
  trainingDescriptions: FormControl<string[]>;
}>;

export function equipmentPatchFromForm(form: EquipmentForm): EquipmentPatch {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }
  return form.value as EquipmentPatch;
}

export function equipmentForm(): EquipmentForm {
  const equipments = inject(EquipmentService);
  const context = inject(EquipmentContext, { optional: true });

  return new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
      asyncValidators: [
        (c) => equipmentNameUniqueValidator(c as FormControl<string>),
      ],
    }),
    description: new FormControl<string>('', { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    trainingDescriptions: new FormControl<string[]>([], { nonNullable: true }),
  });

  function equipmentNameUniqueValidator(
    control: FormControl<string>,
  ): Observable<{ notUnique: string } | null> {
    const name = control.value;

    return equipments
      .query(new HttpParams({ fromObject: { name: name } }))
      .pipe(
        map((names) =>
          names.length > 0 ? { notUnique: 'Name is not unique' } : null,
        ),
      );
  }
}

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
    EquipmentTagInputComponent,
    EquipmentTrainingDescriptionsInputComponent,
  ],
  template: `
    <form [formGroup]="form!" (ngSubmit)="commitForm($event)">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput id="equipment-name" formControlName="name" />
        @if (nameErrors && nameErrors['required']) {
          <mat-error>A value is required </mat-error>
        }
        @if (nameErrors && nameErrors['notUnique']) {
          <mat-error>An equipment already exists with that name</mat-error>
        }
      </mat-form-field>

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
export class LabEquipmentFormComponent {
  @Input()
  committed: Equipment | null = null;

  get isCreate() {
    return this.committed == null;
  }

  @Output()
  requestCommit = new EventEmitter<EquipmentPatch>();

  @Output()
  requestReset = new EventEmitter<void>();

  @ViewChild('formActionControls', { static: true })
  formActionControls: TemplateRef<any> | undefined;

  readonly form = equipmentForm();

  get nameErrors(): ValidationErrors | null {
    return this.form!.controls.name.errors;
  }

  get committedTrainingDescriptions(): string[] {
    return this.committed?.trainingDescriptions || [];
  }

  get trainingDescripionsFormArr(): FormControl<string[]> {
    return this.form!.controls.trainingDescriptions;
  }

  commitForm(evt: Event) {
    const patch = equipmentPatchFromForm(this.form!);
    this.requestCommit.emit(patch);
    evt.preventDefault();
  }
  resetForm() {
    this.requestReset.emit();
  }

  _descriptionTextareaHeightPx = 60;
  _onDescriptionInput(evt: Event) {
    this._descriptionTextareaHeightPx = (evt.target as Element).scrollHeight;
  }
}
