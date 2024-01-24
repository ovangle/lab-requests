import { Component, Injectable, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { filter, firstValueFrom, map, switchMap } from 'rxjs';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Campus,
  CampusCode,
  CampusService,
} from './campus';

export type CampusForm = FormGroup<{
  code: FormControl<CampusCode>;
  name: FormControl<string>;
}>;

export function campusForm(): CampusForm {
  const service = inject(CampusService);
  return new FormGroup({
    code: new FormControl<CampusCode>('', {
      nonNullable: true,
      validators: [ Validators.required, Validators.pattern(/^[_A-Z]{0,8}$/) ],
      asyncValidators: [
        (control) => validateCodeUnique(control as FormControl<CampusCode>),
      ],
    }),
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
  });

  function validateCodeUnique(control: FormControl<CampusCode>) {
    return service.queryPage({ code: control.value }).pipe(
      map((page) => page.totalItemCount),
      map((count) => {
        if (count > 0) {
          return { notUnique: 'Code is not unique amongst campuses' };
        }
        return null;
      }),
    );
  }
}

@Component({
  selector: 'uni-campus-form',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatFormFieldModule ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Code</mat-label>
        <input matInput formControlName="code" />

        @if (codeErrors && codeErrors['required']) {
          <mat-error> A value is required </mat-error>
        }

        @if (codeErrors && codeErrors['pattern']; as pattern) {
          <mat-error> Value must match pattern {{ pattern }} </mat-error>
        }
        @if (codeErrors && codeErrors['notUnique']) {
          <mat-error> Value is not unique </mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput type="text" formControlName="name" />

        @if (nameErrors && nameErrors['required']) {
          <mat-error> A name is required </mat-error>
        }
      </mat-form-field>

      <div class="form-actions">
        <button mat-button (click)="commit()">Save</button>
        <button mat-butgton (click)="cancel()">Cancel</button>
      </div>
    </form>
  `,
})
export class CampusFormComponent {
  readonly form = campusForm();

  @Input()
  get name(): string {
    return this.form.value[ 'name' ]!;
  }
  set name(value: string) {
    this.form.patchValue({ name: value });
  }

  get nameErrors(): ValidationErrors | null {
    return this.form.controls.name.errors;
  }

  get codeErrors(): ValidationErrors | null {
    return this.form.controls.code.errors;
  }

  async commit() {
    throw new Error('not implemented');
  }

  async cancel() {
    this.form.reset();
  }
}
