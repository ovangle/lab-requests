import { CommonModule, CurrencyPipe, DOCUMENT, formatCurrency } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, EventEmitter, Input, Output, Signal, inject, input, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControlDirective,
  ControlValueAccessor,
  FormControl,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  NEVER,
  Observable,
  combineLatest,
  defer,
  distinctUntilChanged,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
} from 'rxjs';
import { AbstractFormFieldInput, formFieldInputProviders } from '../forms/abstract-form-field-input.component';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

let _currentControlId = 0;
function _nextControlId() {
  return _currentControlId++;
}


@Component({
  selector: 'common-currency-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
  <input #valueInput matInput type="text"
        [formControl]="_inputControl"
        (focus)="focusedSubject.next(true)"
        (blur)="focusedSubject.next(false); _onTouched()" />
  `,
  providers: [
    { provide: MatFormFieldControl, useExisting: CurrencyInputComponent }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrencyInputComponent implements ControlValueAccessor, MatFormFieldControl<number> {
  readonly _document = inject(DOCUMENT);
  readonly input: Signal<ElementRef> = viewChild.required('valueInput');

  readonly controlType = 'common-currency-input';
  readonly id = `${this.controlType}-${_nextControlId()}`;
  readonly placeholder = '';

  readonly ngControl = inject(NgControl, { self: true });

  readonly _inputControl = new FormControl<string>('0.00', {
    nonNullable: true,
    validators: [
      Validators.pattern(/^([0-9]+)(,[0-9]{3})*(.[0-9]{0,2})?$/)
    ]
  });
  readonly _input = viewChild.required(MatInput);

  protected _coerceValue(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    } else if (typeof value === 'string') {
      const value_ = (value || '').replaceAll(',', '');
      const n = Number.parseFloat(value_);

      if (Number.isNaN(n)) {
        throw new Error(`${n} is not a valid value for ${this.controlType} input`);
      }

      return n;
    } else {
      throw new Error('Expected a number or string');
    }
  }
  _required = input(false, { transform: coerceBooleanProperty, alias: 'required' });
  get required() {
    return this._required();
  }

  readonly valueSubject = new BehaviorSubject<number>(0);
  get value() {
    return this.valueSubject.value;
  }

  get empty() {
    return this.valueSubject.value === 0;
  }

  readonly focusedSubject = new BehaviorSubject<boolean>(false);
  get focused() { return this.focusedSubject.value; }

  shouldLabelFloat = true;

  get disabled() {
    return this._inputControl.disabled;
  }

  constructor() {
    this.ngControl.valueAccessor = this;
    this._inputControl.valueChanges.pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(),
      map(v => (v || '').replaceAll(',', '')),
      map(v => Number.parseFloat(v)),
      filter(v => Number.isNaN(v)),
    ).subscribe(this.valueSubject);

    inject(DestroyRef).onDestroy(() => {
      this.valueSubject.complete();
      this.focusedSubject.complete();
    })
  }

  readonly stateChanges = combineLatest([
    this.valueSubject,
    this.focusedSubject,
    toObservable(this._required)
  ]).pipe(map(() => undefined));

  get errorState() {
    return !this._inputControl.valid;
  }
  autofilled = false;

  _describedByIds: string[] = [];
  setDescribedByIds(ids: string[]): void {
    this._describedByIds = ids;
  }
  onContainerClick(event: MouseEvent): void {
    this._input().onContainerClick();
  }

  writeValue(value: any): void {
    if (value === null) {
      this._inputControl.reset();
    } else if (typeof value === 'number') {
      const strValue = formatCurrency(value, 'en', '');
      this._inputControl.setValue(formatCurrency(value, 'en', ''));
    } else {
      throw new Error('Invalid value for currency control. Expected a number');
    }
  }

  _onChange = (value: any) => { }
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  _onTouched = () => { }
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    if (isDisabled && !this.disabled) {
      this._inputControl.disable();
    }

    if (!isDisabled && this.disabled) {
      this._inputControl.enable();
    }
  }

}