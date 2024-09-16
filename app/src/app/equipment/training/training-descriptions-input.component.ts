import { coerceBooleanProperty, coerceStringArray } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { NONE_TYPE } from '@angular/compiler';
import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  Input,
  Output,
  viewChild,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AbstractControlDirective,
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  FormsModule,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  combineLatest,
  map,
} from 'rxjs';
import { parseTrainingDescriptions } from './training-descriptions';
import { EquipmentTrainingDescriptionListComponent } from './training-description-list.component';
import { TextFieldModule } from '@angular/cdk/text-field';

let _currentId = 0;
function _nextControlId() {
  return _currentId++;
}

@Component({
  selector: 'equipment-training-descriptions-hint',
  standalone: true,
  template: `Multiple descriptions can be input by prefixing a newline by '-'`
})
export class EquipmentTrainingDescriptionsFieldHint { }

@Component({
  selector: 'equipment-training-descriptions-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    TextFieldModule,

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,

    EquipmentTrainingDescriptionListComponent,
  ],
  template: `
    <textarea matInput cdkTextareaAutosize
             [value]="value.join('\n')" (valueChange)="onTextChange($event)"
             (focus)="focusedSubject.next(true)"
             (blur)="focusedSubject.next(false)"
    >
    </textarea>
  `,
  styles: [
    `
      mat-form-field {
        padding-top: 10px;
      }
      mat-form-field textarea[matInput] {
        min-height: 200px;
      }
    `,
  ],
  providers: [
    { provide: MatFormFieldControl, useExisting: EquipmentTrainingDescriptionsInputComponent }
  ],
})
export class EquipmentTrainingDescriptionsInputComponent implements ControlValueAccessor, MatFormFieldControl<string[]> {
  readonly controlType = 'equipment-training-descriptions-input';
  readonly id = `${this.controlType}-${_nextControlId()}`;

  readonly ngControl = inject(NgControl, { self: true });
  readonly placeholder = '';

  _inputElement = viewChild.required(MatInput)

  readonly valueSubject = new BehaviorSubject<string[]>([]);
  get value() {
    return this.valueSubject.value;
  }

  get empty() {
    return this.value.length === 0;
  }

  get shouldLabelFloat() {
    return this.empty || this.focused;
  }

  readonly disabledSubject = new BehaviorSubject<boolean>(false);
  get disabled() { return this.disabledSubject.value; }

  readonly focusedSubject = new BehaviorSubject<boolean>(false);
  get focused() { return this.focusedSubject.value; }

  _required = input(false, { transform: coerceBooleanProperty, alias: 'required' });
  get required() { return this._required(); }

  onTextChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const descriptions = parseTrainingDescriptions(value);
    this.valueSubject.next(descriptions);
    this._onChange(descriptions);
  }

  get errorState() {
    return !this.ngControl.valid;
  }

  readonly describedByIdsSubject = new BehaviorSubject<string[]>([]);
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSubject.next(ids);
  }

  onContainerClick(event: MouseEvent): void {
    this._inputElement().onContainerClick();
  }

  readonly stateChanges = combineLatest([
    this.valueSubject,
    this.disabledSubject,
    this.focusedSubject,
    toObservable(this._required),
  ]).pipe(map(() => undefined))

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  ngOnDestroy() {
    this.valueSubject.complete();
    this.disabledSubject.complete();
    this.focusedSubject.complete();
    this.describedByIdsSubject.complete();
  }

  writeValue(descriptions: string | string[]): void {
    if (!Array.isArray(descriptions)) {
      throw new Error('Value must be an array of strings');
    }
    this.valueSubject.next(descriptions);
  }

  _onChange = (value: string[]) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  _onTouched = () => { };
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabledSubject.next(isDisabled);
  }
}
