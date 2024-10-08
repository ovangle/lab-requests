import { Component, input, Input } from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, formatNumber } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subscription } from 'rxjs';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'equipment-training-acknowledgement',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,
  ],
  template: `
    <mat-card [class.readonly]="readonly">
      <mat-card-header>
        <h3>Required Training</h3>
      </mat-card-header>

      <mat-card-content>
        <mat-selection-list [formControl]="selectedControl">
          @for (description of trainingDescriptions(); track description) {
            <mat-list-option [value]="description">{{
              description
            }}</mat-list-option>
          } @empty {
            <mat-list-item disabled class="empty-list">
              <mat-icon>warning</mat-icon>
              <i>No training required</i>
            </mat-list-item>
          }
        </mat-selection-list>
      </mat-card-content>

      <mat-card-footer>
        <ng-content select=".controls"></ng-content>
      </mat-card-footer>
    </mat-card>
  `,
  styles: [
    `
      .readonly {
        background-color: cream;
      }

      .empty-list mat-icon {
        width: inherit;
        height: inherit;
        font-size: inherit;
        line-height: inherit;
        vertical-align: bottom;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: EquipmentTrainingAcknowlegementComponent,
    },
  ],
})
export class EquipmentTrainingAcknowlegementComponent
  implements ControlValueAccessor {
  trainingDescriptions = input.required<string[]>();

  readonly selectedControl = new FormControl<string[]>([], {
    nonNullable: true,
  });

  @Input()
  get readonly(): boolean {
    return this.selectedControl.disabled;
  }
  set readonly(input: BooleanInput) {
    const isDisabled = coerceBooleanProperty(input);
    this._toggleSelectionDisabled(isDisabled);
  }
  _toggleSelectionDisabled = disabledStateToggler(this.selectedControl);

  constructor() {
    this.selectedControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this._onChange(v));
  }

  _isDisabled: boolean = false;

  _subscriptions: Subscription[] = [];

  ngOnDestroy() {
    this._subscriptions.forEach((s) => s.unsubscribe());
  }

  writeValue(value: string[]): void {
    this.selectedControl.setValue(value);
  }
  _onChange = (value: string[]) => { };
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => { };
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this._isDisabled = isDisabled;
  }
}
