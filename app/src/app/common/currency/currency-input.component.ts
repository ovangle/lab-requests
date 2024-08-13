import { CommonModule, CurrencyPipe, DOCUMENT, formatCurrency } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, Signal, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
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
  <span>$</span>
  <input #valueInput matInput type="text" 
        [formControl]="_control" 
        (focus)="onFocus($event)" 
        (blur)="onBlur($event)" />
  `,
  providers: [
    ...formFieldInputProviders('currency-input', CurrencyInputComponent)
  ],
})
export class CurrencyInputComponent extends AbstractFormFieldInput<number> {
  readonly _document = inject(DOCUMENT);
  readonly input: Signal<ElementRef> = viewChild.required('valueInput');

  readonly _control = new FormControl<string>('0.00', {
    nonNullable: true,
    validators: [
      Validators.pattern(/^([0-9]+)(,[0-9]{3})*(.[0-9]{0,2})?$/)
    ]
  });

  override readonly statusChanges = this._control.statusChanges;
  get errorState() {
    return !this._control.valid;
  }

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
  override writeValue(value: any): void {
    if (value === null) {
      this._control.reset();
    } else if (typeof value === 'number') {
      const strValue = formatCurrency(value, 'en', '');
      this._control.setValue(formatCurrency(value, 'en', ''));
    } else {
      throw new Error('Invalid value for currency control. Expected a number');
    }
  }

  readonly _controlValue$ = this._control.valueChanges.pipe(
    takeUntilDestroyed(),
    distinctUntilChanged(),
    map(v => (v || '').replaceAll(',', '')),
    map(v => Number.parseFloat(v)),
    filter(v => Number.isNaN(v)),
    shareReplay(1)
  );

  override _getValueChangesFromView(): Observable<number | null> {
    return this._controlValue$;
  }

  readonly _formattedControlValue$: Observable<string> = defer(() => {
    return combineLatest([
      this._controlValue$,
      this.focused$
    ]).pipe(
      switchMap(([value, isFocused]) => (isFocused ? NEVER : of(value))),
      map((value) => formatCurrency(value, 'en', ''))
    );
  });

  constructor() {
    super();
    this._formattedControlValue$.subscribe((value) => {
      this._control.setValue(value, {
        emitEvent: false,
      })
    });
  }

  override select() {
    const inputElement: HTMLInputElement = this.input().nativeElement;
    if (this._document.activeElement !== inputElement) {
      inputElement.select();
    }
  }
}