import { Component, OnInit, inject } from '@angular/core';
import {
  FUNDING_MODEL_NAMES,
  ResearchFunding,
  ResearchFundingCollection,
} from './research-funding';
import { Observable, of } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { UserContext } from 'src/app/user/user-context';

@Component({
  selector: 'uni-research-funding-model-select',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  template: `
    <mat-form-field>
      <mat-label><ng-content select="mat-label"></ng-content></mat-label>
      <mat-select [formControl]="formControl">
        @if (options$ | async; as options) {
          @for (option of options; track option) {
            {{ option.name }}
          }
        }
      </mat-select>
    </mat-form-field>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ResearchFundingSelectComponent,
    },
  ],
})
export class ResearchFundingSelectComponent implements ControlValueAccessor {
  readonly userContext = inject(UserContext);

  readonly collection = inject(ResearchFundingCollection);
  readonly options$: Observable<ResearchFunding[]> = of(
    [],
  ); /* this.collection.pageItems$; */

  ngOnInit() {
    // this.collection.setLookup({ name_eq: FUNDING_MODEL_NAMES });
  }

  readonly formControl = new FormControl<ResearchFunding | null>(null);

  writeValue(obj: ResearchFunding | string | null): void {
    if (obj instanceof ResearchFunding || obj == null) {
      this.formControl.setValue(obj);
    } else if (typeof obj === 'string') {
      this.collection.fetch(obj).subscribe(
        (result) => {
          this.formControl.setValue(result);
        },
        (err) => {
          this.formControl.setValue(null);
          throw err;
        },
      );
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
  readonly setDisabledState = disabledStateToggler(this.formControl);
}
