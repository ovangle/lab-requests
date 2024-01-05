import { CommonModule } from '@angular/common';
import { Component, ViewChild, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Task } from './task';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ResourceFormService } from '../../resource/resource-form.service';
import { ProvisionFormComponent } from '../../resource/provision/provision-form.component';
import { MatRadioModule } from '@angular/material/radio';
import { Observable, startWith, filter, map } from 'rxjs';
import { collectFieldErrors } from 'src/app/utils/forms/validators';
import {
  CostEstimateForm,
  costEstimateForm,
} from 'src/app/uni/research/funding/cost-estimate/cost-estimate-form.component';

export type TaskForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  supplier: FormControl<'technician' | 'researcher' | 'other'>;
  externalSupplierDescription: FormControl<string>;

  isUniversitySupplied: FormControl<boolean>;
  estimatedCost: CostEstimateForm;
}>;

export function taskForm(): TaskForm {
  return new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      description: new FormControl('', { nonNullable: true }),
      supplier: new FormControl<'researcher' | 'technician' | 'other'>(
        'researcher',
        { nonNullable: true },
      ),
      externalSupplierDescription: new FormControl<string>('', {
        nonNullable: true,
      }),
      isUniversitySupplied: new FormControl(false, { nonNullable: true }),
      estimatedCost: costEstimateForm(),
    },
    {
      asyncValidators: [(c) => collectFieldErrors(c as TaskForm)],
    },
  );
}

export type TaskFormErrors = ValidationErrors & {
  name: { required: string | null };
};

export function taskFormErrors(
  form: TaskForm,
): Observable<TaskFormErrors | null> {
  return form.statusChanges.pipe(
    startWith(form.status),
    filter((status) => status != 'PENDING'),
    map(() => form.errors as TaskFormErrors),
  );
}

@Component({
  selector: 'lab-task-resource-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,

    ProvisionFormComponent,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />
        @if (nameErrors?.required) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Description</mat-label>
        <textarea matInput formControlName="description"> </textarea>
      </mat-form-field>

      <p>Work towards this task is to be completed</p>
      <mat-radio-group formControlName="supplier">
        <mat-radio-button value="technician"> By technician </mat-radio-button>
        <br />
        <mat-radio-button value="researcher"> By researcher </mat-radio-button>
        <br />
        <mat-radio-button value="other">
          By external contractor
        </mat-radio-button>
        <br />
      </mat-radio-group>

      @switch (supplier) {
        @case ('other') {
          <lab-resource-provision-form
            [form]="form"
            [canResearcherSupply]="true"
          />
        }
      }
    </form>
  `,
})
export class TaskResourceFormComponent {
  readonly formService = inject(ResourceFormService<Task, TaskForm>);

  get form(): TaskForm {
    return this.formService.form;
  }

  get nameErrors(): TaskFormErrors['name'] | null {
    return this.form.controls.name.errors as TaskFormErrors['name'] | null;
  }

  get supplier(): 'technician' | 'researcher' | 'other' {
    return this.form.controls.supplier.value;
  }

  get isLabTechService() {
    return this.supplier == 'technician';
  }
}
