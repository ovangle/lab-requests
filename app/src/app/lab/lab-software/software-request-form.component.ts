import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NewSoftwareRequest, newSoftwareRequestForm } from './software';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

@Component({
  selector: 'lab-software-request-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Name</mat-label>
        <input matInput formControlName="name" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Reason</mat-label>
        <textarea matInput formControlName="description"></textarea>
      </mat-form-field>
    </form>
  `,
})
export class LabSoftwareRequestFormComponent {
  readonly form = newSoftwareRequestForm();

  @Input()
  get name() {
    return this.form.value.name!;
  }
  set name(value: string) {
    this.form.patchValue({ name: value });
  }

  @Input()
  get disabled() {
    return this.form.disabled;
  }
  set disabled(isDisabled: BooleanInput) {
    this._toggleDisabled(coerceBooleanProperty(isDisabled));
  }
  _toggleDisabled = disabledStateToggler(this.form);

  @Output()
  softwareRequestChange = new EventEmitter<NewSoftwareRequest>();

  constructor() {
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(),
        filter(() => this.form.valid),
      )
      .subscribe((value) =>
        this.softwareRequestChange.emit(value as NewSoftwareRequest),
      );
  }
}
