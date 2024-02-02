import { validate as validateIsUUID } from 'uuid';
import { CommonModule } from '@angular/common';
import { Component, Injectable, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  BehaviorSubject,
  Observable,
  ReplaySubject,
  defer,
  filter,
  map,
  of,
  shareReplay,
  skipWhile,
  startWith,
  switchMap,
  withLatestFrom,
} from 'rxjs';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import {
  Equipment,
  EquipmentCollection,
  EquipmentQuery,
  EquipmentService,
  equipmentQueryToHttpParams,
  injectEquipmentService,
} from './equipment';
import { EquipmentLike } from './equipment-like';
import { isUUID } from 'src/app/utils/is-uuid';
import { ResearchFunding } from 'src/app/research/funding/research-funding';
import { EquipmentProvisionRequestFormComponent } from './provision/equipment-provision-request-form.component';
import { Lab } from '../lab';
import { LabEquipmentProvision, LabEquipmentProvisionRequest } from './provision/lab-equipment-provision';

const _NEW_EQUIPMENT_ = '_NEW_EQUIPMENT_';

@Component({
  selector: 'lab-equipment-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,

    EquipmentProvisionRequestFormComponent,
  ],
  template: `
    <mat-form-field>
      <mat-label><ng-content select="mat-label"></ng-content></mat-label>

      <input
        matInput
        [matAutocomplete]="autocomplete"
        [formControl]="searchControl"
      />

      <mat-autocomplete
        #autocomplete
        [displayWith]="_displaySearch"
        (optionSelected)="_optionSelected($event)"
      >
        @if (searchOptions$ | async; as searchOptions) {
          @for (equipment of searchOptions; track equipment.id) {
            <mat-option [value]="equipment">
              {{ equipment.name }}
            </mat-option>
          }
        }

        <mat-option [value]="_NEW_EQUIPMENT_">
          The required equipment was not in this list
        </mat-option>
      </mat-autocomplete>
    </mat-form-field>

    @if (isNewEquipment$ | async; as isNewEquipment) {
      <mat-card>
        <mat-card-header>
          <h3>Request other equipment</h3>
          <button mat-icon-button (click)="_cancelNewEquipment()">
            <mat-icon>cancel</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <lab-equipment-provision-request-form
            [equipmentName]="prefillName$ | async"
            [lab]="inLab"
            [disabled]="_disabled"
            [funding]="funding!"
            (save)="_equipmentRequest.next($event)"
          />
        </mat-card-content>
        <mat-card-footer #createFormControls> </mat-card-footer>
      </mat-card>
    }
  `,
  providers: [
    EquipmentCollection,
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: EquipmentSearchComponent,
    },
  ],
})
export class EquipmentSearchComponent implements ControlValueAccessor {
  readonly _NEW_EQUIPMENT_ = _NEW_EQUIPMENT_;

  readonly equipments = injectEquipmentService();
  readonly searchControl = new FormControl<Equipment | string>('', {
    nonNullable: true,
  });

  /**
   * Show only equipment from the given lab
   */
  @Input({ required: true })
  inLab: Lab | null = null;

  readonly isNewEquipment$ = this.searchControl.valueChanges.pipe(
    map((value) => value === this._NEW_EQUIPMENT_),
  );
  readonly prefillName$ = this.searchControl.valueChanges.pipe(
    skipWhile(value => value == _NEW_EQUIPMENT_),
    map((value) => {
      if (value instanceof Equipment) {
        return value.name;
      } else {
        return value;
      }
    }),
    shareReplay(1)
  );

  readonly _equipmentRequest = new ReplaySubject<LabEquipmentProvision>(1);

  readonly searchOptions$ = this.searchControl.valueChanges.pipe(
    switchMap((search) => {
      if (search instanceof Equipment) {
        return of([ search ]);
      }
      return this.equipments.query(equipmentQueryToHttpParams({
        lab: this.inLab,
        name: search
      }))
    }),
    shareReplay(1),
  );

  @Input({ required: true })
  funding: ResearchFunding | undefined = undefined;

  readonly value$: Observable<Equipment | LabEquipmentProvision | null> = defer(
    () => {
      return this.searchControl.valueChanges.pipe(
        startWith(this.searchControl.value),
        switchMap((value) => {
          if (value === _NEW_EQUIPMENT_) {
            return this._equipmentRequest;
          } else if (typeof value === 'string') {
            return of(null);
          } else {
            return of(value);
          }
        }),
      );
    },
  );

  constructor() {
    this.searchControl.valueChanges.pipe(
      takeUntilDestroyed(),
      map((searchText) => ({ searchText }) as EquipmentQuery),
    );

    // Dispatch _onChange events
    this.value$.pipe(takeUntilDestroyed()).subscribe((v) => this._onChange(v));
  }

  _optionSelected(option: MatAutocompleteSelectedEvent) {
    if (option.option.value === _NEW_EQUIPMENT_) {
      this.searchControl.disable();
    }
  }

  _cancelNewEquipment() {
    this.searchControl.setValue('');
    this.searchControl.enable();
  }

  writeValue(obj: EquipmentLike | null): void {
    if (isUUID(obj)) {
      this.equipments
        .fetch(obj)
        .subscribe((equipment) => this.searchControl.setValue(equipment));
    }
    if (typeof obj === 'string' || obj == null) {
      this.searchControl.setValue(obj || '');
    }
    if (obj instanceof Equipment) {
      this.searchControl.setValue(obj);
    } else if (obj instanceof LabEquipmentProvision) {
      this.searchControl.setValue(this._NEW_EQUIPMENT_);
      this._equipmentRequest.next({ ...obj });
    }
  }

  _onChange = (value: any) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => { };
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  protected _searchDisabled = disabledStateToggler(this.searchControl);
  _disabled: boolean = false;
  setDisabledState(isDisabled: boolean): void {
    this._searchDisabled(isDisabled);
    this._disabled = isDisabled;
  }

  _displaySearch(value: Equipment | string) {
    if (value instanceof Equipment) {
      return value.name;
    } else if (value === _NEW_EQUIPMENT_) {
      return 'New equipment';
    } else {
      return value;
    }
  };
}
