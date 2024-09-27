import { CommonModule, formatNumber } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, Input, ViewEncapsulation, inject, input, model, viewChild } from '@angular/core';
import {
  ControlContainer,
  ControlValueAccessor,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { DISCLIPLINES, Discipline, disciplineFromJson, formatDiscipline, isDiscipline } from './discipline';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { DisciplinePipe } from './discipline.pipe';
import { modelEnumMetaProviders, ModelEnumSelect } from 'src/app/common/model/forms/abstract-enum-select.component';
import { AbstractFormFieldInput, formFieldInputProviders } from 'src/app/common/forms/abstract-form-field-input.component';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { AsyncSubject, BehaviorSubject, buffer, combineLatest, map, switchMap } from 'rxjs';

let _controlId = 0;
function _nextControlId() {
  return _controlId++;
}


@Component({
  selector: 'uni-discipline-select',
  standalone: true,
  imports: [
    FormsModule,
    MatSelectModule,
    DisciplinePipe
  ],
  template: `
  <mat-select [value]="value"
              (valueChange)="writeValue($event); _onChange($event)"
              [multiple]="multiple()"
              [disabled]="disabled">
    @for (discipline of disciplines; track discipline) {
      <mat-option [value]="discipline">
        {{discipline | uniDiscipline}}
      </mat-option>
    }
  </mat-select>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MatFormFieldControl, useExisting: UniDisciplineSelect }
  ]
})
export class UniDisciplineSelect implements MatFormFieldControl<Discipline[] | Discipline>, ControlValueAccessor {
  readonly controlType = 'uni-discipline-select';
  readonly id = `${this.controlType}-${_nextControlId()}`;
  readonly placeholder = '';
  readonly valueSubject = new BehaviorSubject<Discipline[] | Discipline | null>(null)
  get value() {
    return this.valueSubject.value;
  }

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  autofilled?: boolean | undefined;
  userAriaDescribedBy?: string | undefined;
  disableAutomaticLabeling?: boolean | undefined;

  _describedByIdsSubject = new BehaviorSubject<string[]>([]);
  setDescribedByIds(ids: string[]): void {
    this._describedByIdsSubject.next(ids);
  }
  readonly _matSelect = viewChild.required(MatSelect);
  onContainerClick(event: MouseEvent): void {
    this._matSelect().onContainerClick();
  }

  get focused() {
    return this._matSelect().focused;
  }

  get disabled() {
    return this.ngControl.disabled || false;
  }

  get errorState() {
    return this._matSelect().errorState;
  }

  get shouldLabelFloat() {
    return this._matSelect().shouldLabelFloat;
  }

  readonly _viewInit = new AsyncSubject<undefined>();
  ngAfterViewInit() {
    this._viewInit.next(undefined);
    this._viewInit.complete();
  }
  readonly _destroyRef = inject(DestroyRef);

  readonly disciplines = DISCLIPLINES;

  readonly ngControl = inject(NgControl, { self: true });

  readonly multiple = input(false, { transform: coerceBooleanProperty });
  readonly _required = input(false, { transform: coerceBooleanProperty });
  get required() {
    return this._required();
  }
  readonly _requiredChange = toObservable(this._required);

  get empty() {
    if (this.multiple()) {
      return this.value == null || this.value.length == 0;
    } else {
      return this.value == null;
    }
  }

  writeValue(obj: any): void {
    console.log('writing value', obj);
    if (this.multiple() && !Array.isArray(obj)) {
      throw new Error(`Multiple select requires an array value`);
    }
    if (!this.multiple() && (!isDiscipline(obj) || obj == null)) {
      throw new Error(`Mutliple selection requires a discipline or null`);
    }
    this.valueSubject.next(obj);
  }

  _onChange = (value: any) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => { };
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  readonly disabledSubject = new BehaviorSubject(false);
  setDisabledState(isDisabled: boolean): void {
    this.disabledSubject.next(isDisabled);
  }

  readonly stateChanges = combineLatest([
    this.valueSubject,
    toObservable(this._required),
    this.disabledSubject
  ]).pipe(
    buffer(this._viewInit),
    map(() => undefined)
  );
}