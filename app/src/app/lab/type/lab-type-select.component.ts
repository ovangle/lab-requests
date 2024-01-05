import { Component, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { LabType, labTypes } from './lab-type';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

@Component({
  selector: 'lab-type-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <mat-form-field>
      <mat-label>
        <ng-content select="mat-label"></ng-content>
      </mat-label>
      <mat-select [formControl]="_control" (closed)="_onTouched()">
        <mat-option *ngFor="let labType of labTypes" [value]="labType">{{
          labType
        }}</mat-option>
      </mat-select>

      <mat-error>
        <ng-content select="mat-error"></ng-content>
      </mat-error>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: LabTypeSelectComponent,
    },
  ],
  styles: [
    `
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class LabTypeSelectComponent implements ControlValueAccessor {
  readonly labTypes = labTypes;

  readonly _control = new FormControl<LabType | null>(null);

  @Input()
  get required() {
    return this._control.hasValidator(Validators.required);
  }
  set required(required: BooleanInput) {
    const isRequired = coerceBooleanProperty(required);
    if (isRequired && !this.required) {
      this._control.addValidators(Validators.required);
    }
    if (!isRequired && this.required) {
      this._control.removeValidators(Validators.required);
    }
  }

  constructor() {
    this._control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this._onChange(value);
    });
  }

  writeValue(value: any) {
    this._control.setValue(value);
  }
  _onChange = (value: LabType | null) => {};
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => {};
  registerOnTouched(fn: any) {
    this._onTouched = fn;
  }

  readonly setDisabledState = disabledStateToggler(this._control);
}
