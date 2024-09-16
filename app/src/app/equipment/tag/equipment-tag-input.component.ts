import { CommonModule } from '@angular/common';
import { Component, inject, viewChild } from '@angular/core';
import { AbstractControlDirective, ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatChipEditedEvent,
  MatChipGrid,
  MatChipInputEvent,
  MatChipsModule,
} from '@angular/material/chips';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import * as uuid from 'uuid';
import { EquipmentTagService } from './equipment-tag';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

interface EquipmentTag {
  id: string;
  name: string;
}

let _currentId = 0;
function _nextControlId() {
  return _currentId++;
}

@Component({
  selector: 'equipment-tags-input',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
      <mat-chip-grid #chipGrid>

        <!-- TODO: Autocomplete -->
        @for (tag of value; track tag) {
          <mat-chip-row
            (removed)="remove(tag)"
            [editable]="true"
            (edited)="edit(tag, $event)"
            [disabled]="disabled"
          >
            {{ tag }}
            <button matChipRemove>
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-chip-row>
        }
        <input
          placeholder="Add tag..."
          [matChipInputFor]="chipGrid"
          [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
          matChipInputAddOnBlur
          (matChipInputTokenEnd)="add($event)"
          [disabled]="disabled"
          (focus)="focusSubject.next(true)"
          (blur)="focusSubject.next(false)"
        />
      </mat-chip-grid>
  `,
  providers: [
    EquipmentTagService,
    { provide: MatFormFieldControl, useExisting: EquipmentTagInputComponent }

  ],
})
export class EquipmentTagInputComponent implements ControlValueAccessor, MatFormFieldControl<string[]> {
  readonly controlType = 'equipment-tag-input';
  readonly id = `${this.controlType}-${_nextControlId()}`;

  readonly placeholder = '';
  readonly required = false;
  readonly ngControl = inject(NgControl, { self: true });
  readonly _chipGrid = viewChild.required(MatChipGrid);
  readonly _chipInput = viewChild.required('input');

  get errorState() {
    return !this.ngControl.valid;
  }

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  readonly valueSubject = new BehaviorSubject<string[]>([]);
  get value() {
    return this.valueSubject.value;
  }

  get empty() {
    return this.value.length === 0;
  }

  readonly focusSubject = new BehaviorSubject(false);
  get focused() { return this.focusSubject.value; }

  get shouldLabelFloat() {
    return !this.empty || this.focused;
  }
  readonly disabledSubject = new BehaviorSubject(false);
  get disabled() { return this.disabledSubject.value; }


  readonly describedByIdsSubject = new BehaviorSubject<string[]>([]);
  setDescribedByIds(ids: string[]): void {
    this.describedByIdsSubject.next(ids);
  }

  onContainerClick(event: MouseEvent): void {
    this._chipGrid().onContainerClick(event);
  }

  readonly stateChanges = combineLatest([
    this.valueSubject,
    this.focusSubject,
    this.disabledSubject,
  ]).pipe(map(() => undefined));

  constructor() {
    this.ngControl.valueAccessor = this;
  }

  ngOnDestroy() {
    this.valueSubject.complete();
    this.focusSubject.complete();
    this.disabledSubject.complete();
    this.describedByIdsSubject.complete();
  }

  add(event: MatChipInputEvent) {
    const name = event.value.trim().toLocaleLowerCase();
    if (name && !this.value.includes(name)) {
      this.writeValue([...this.value, name]);
    }
    event.chipInput!.clear();
    this._onChange(this.value);
  }

  remove(tag: string) {
    const tags = this.value.filter((t) => t !== tag);
    this.writeValue(tags);
    this._onChange(tags);
  }

  edit(tag: string, evt: MatChipEditedEvent) {
    const name = evt.value.trim().toLocaleLowerCase();
    if (!name) {
      this.remove(tag);
    }
    const value = [...this.value];
    value.splice(this.value.indexOf(tag), 1, tag);
    this.writeValue(value);
    this._onChange(value);
  }


  writeValue(obj: string[]): void {
    this.valueSubject.next(obj);
  }
  _onChange = (value: string[]) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => { };
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabledSubject.next(isDisabled);
  }

}
