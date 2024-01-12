import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MeasurementUnitPipe } from './common-measurement-unit.pipe';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { filter, map } from 'rxjs';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'common-measurement-unit-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,

    MeasurementUnitPipe,
  ],
  template: `
    <mat-form-field>
      <mat-label><ng-content select="mat-label"></ng-content></mat-label>
      <input
        matInput
        [formControl]="_control"
        [required]="_required"
        (blur)="_onInputBlur()"
      />

      @if (!_touched) {
        <mat-hint>
          Use caret ('^') to indicate superscript (e.g. m^2 -> m<sup>2</sup>)
        </mat-hint>
      }

      @if (_control.errors && _control.errors['required']) {
        <mat-error> A value is required </mat-error>
      }

      @if (_control.errors && _control.errors['pattern']) {
        <mat-error> Unit can only contain letters, digits or '^' </mat-error>
      }

      <mat-error>
        <ng-content select="mat-error"></ng-content>
      </mat-error>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CommonMeasurementUnitInputComponent,
    },
  ],
})
export class CommonMeasurementUnitInputComponent
  implements ControlValueAccessor {
  readonly _control = new FormControl('', {
    nonNullable: true,
    validators: [
      (c) => (this.required ? Validators.required(c) : null),
      Validators.pattern(/^[\^a-z0-9]*$/i),
    ],
  });

  @Input()
  get required() {
    return this._required;
  }
  set required(input: BooleanInput) {
    this._required = coerceBooleanProperty(input);
  }
  _required: boolean = false;

  ngOnInit() {
    this._control.valueChanges
      .pipe(filter(() => this._control.valid))
      .subscribe((value) => this._onChange(value));
  }

  writeValue(obj: any): void {
    this._control.setValue(obj);
  }
  _onChange = (value: any) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _touched: boolean = false;
  _onTouched = () => {
    this._touched = true;
  };

  _onInputBlur() {
    this._touched = true;
    this._onTouched();
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  readonly setDisabledState = disabledStateToggler(this._control);
}
