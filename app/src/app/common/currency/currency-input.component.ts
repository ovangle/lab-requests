import { CommonModule, CurrencyPipe, formatCurrency } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  NEVER,
  Observable,
  combineLatest,
  defer,
  filter,
  map,
  of,
  shareReplay,
  skip,
  skipUntil,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';

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
    <mat-form-field>
      <mat-label><ng-content select="mat-label"></ng-content></mat-label>

      <span matTextPrefix>$</span>

      <input
        matInput
        type="text"
        pattern="[0-9]+(.[0-9]{0,2})"
        [formControl]="_control"
        (focus)="_onInputFocus($event)"
        (blur)="_onInputBlur($event)"
      />

      <div matTextSuffix>
        <ng-content select=".input-text-suffix"></ng-content>
      </div>

      <mat-error>
        <ng-content select="mat-error"></ng-content>
      </mat-error>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CurrencyInputComponent,
    },
  ],
})
export class CurrencyInputComponent implements ControlValueAccessor {
  _control = new FormControl<string>('0.00', {
    nonNullable: true,
  });

  readonly _focusSubject = new BehaviorSubject<boolean>(false);

  readonly value$: Observable<number> = this._control.valueChanges.pipe(
    takeUntilDestroyed(),
    map((value) => Number.parseFloat(value)),
    filter((v) => !Number.isNaN(v)),
    shareReplay(1),
  );

  readonly formattedValue$: Observable<string> = defer(() => {
    return combineLatest([this.value$, this._focusSubject]).pipe(
      switchMap(([value, isFocused]) => (isFocused ? NEVER : of(value))),
      map((value) => formatCurrency(value, 'en', '')),
    );
  });

  constructor() {
    this.value$
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this._onChange(value));

    this.formattedValue$.subscribe((value) =>
      this._control.setValue(value, {
        emitEvent: false,
      }),
    );
  }

  ngOnDestroy() {
    this._focusSubject.complete();
  }

  _onInputFocus(event: Event) {
    (event.target as HTMLInputElement).select();
    this._focusSubject.next(true);
  }

  _onInputBlur(event: Event) {
    this._focusSubject.next(false);
    this._onTouched();
  }

  writeValue(obj: any): void {
    this._control.setValue(obj);
  }

  _onChange = (value: any) => {};
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => {};
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  readonly setDisabledState = disabledStateToggler(this._control);
}
