import { Component, OnInit, inject } from '@angular/core';
import {
  FUNDING_MODEL_NAMES,
  ResearchFunding,
  ResearchFundingLookup,
  ResearchFundingService,
  researchFundingIdFromLookup,
} from './research-funding';
import { Observable, map, of, shareReplay } from 'rxjs';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'research-funding-select',
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
          @for (option of options; track option.id) {
            <mat-option [value]="option">{{ option.name }}</mat-option>
          }
        }
      </mat-select>
      <mat-error>
        <ng-content select="mat-error"></ng-content>
      </mat-error>
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

  readonly researchFundings = inject(ResearchFundingService);
  readonly options$: Observable<ResearchFunding[]> = this.researchFundings.all().pipe(
    shareReplay(1)
  );

  readonly formControl = new FormControl<ResearchFunding | null>(null);

  // Coerce control value into ResearchFundingLookup or null
  readonly value$ = this.formControl.valueChanges.pipe(
    takeUntilDestroyed(),
    map(value => {
      if (value instanceof ResearchFunding) {
        return value.id;
      }
      return value;
    })
  );

  writeValue(obj: ResearchFunding | null): void {
    if (obj == null) {
      this.formControl.setValue(null);
    } else {
      this.researchFundings.lookup(obj).subscribe(
        (funding) => this.formControl.setValue(funding)
      );
    }
  }

  ngOnInit() {
    this.value$.subscribe(value => this._onChange(value));
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
