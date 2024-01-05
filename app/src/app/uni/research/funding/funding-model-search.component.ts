import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChildren,
  ElementRef,
  HostBinding,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatError, MatFormFieldModule } from '@angular/material/form-field';
import { FundingModelInfoComponent } from './funding-model-info.component';
import { FundingModel, FundingModelService } from './funding-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, map, of, startWith, switchMap } from 'rxjs';
import { disabledStateToggler } from 'src/app/utils/forms/disable-state-toggler';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'uni-research-funding-model-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,

    FundingModelInfoComponent,
  ],
  template: `
    <mat-form-field>
      <mat-label>
        <ng-content select="mat-label"></ng-content>
      </mat-label>

      <input
        matInput
        [matAutocomplete]="autocomplete"
        [formControl]="searchControl"
        [required]="required"
      />

      <button
        class="reset-button"
        mat-icon-button
        matIconSuffix
        (click)="searchControl.reset()"
      >
        <mat-icon>cancel</mat-icon>
      </button>

      <mat-error>
        <ng-content select=".error"></ng-content>
      </mat-error>
    </mat-form-field>

    <mat-autocomplete #autocomplete [displayWith]="_displayFundingModelInfo">
      <mat-option
        *ngFor="let fundingModel of searchResults$ | async"
        [value]="fundingModel"
      >
        <uni-research-funding-model-info [fundingModel]="fundingModel" nameonly>
        </uni-research-funding-model-info>
      </mat-option>
    </mat-autocomplete>
  `,
  styles: [
    `
      .reset-button {
        color: var(--mat-datepicker-toggle-icon-color);
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: FundingModelSearchComponent,
    },
  ],
})
export class FundingModelSearchComponent implements ControlValueAccessor {
  readonly fundingModelService = inject(FundingModelService);

  @ContentChildren('.error')
  _viewErrors: QueryList<ElementRef>;

  readonly searchControl = new FormControl<FundingModel | string>('', {
    nonNullable: true,
    validators: [
      (c) =>
        (this._viewErrors?.length || 0) > 0
          ? { viewErrors: 'associated form control has errors' }
          : null,
    ],
  });

  @HostBinding('attr.required')
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  _required: boolean;

  readonly searchResults$ = this.searchControl.valueChanges.pipe(
    takeUntilDestroyed(),
    startWith(''),
    switchMap((nameOrFundingModel) => {
      if (nameOrFundingModel instanceof FundingModel) {
        return of([nameOrFundingModel]);
      } else {
        return this.fundingModelService.search(nameOrFundingModel);
      }
    }),
  );

  readonly selected$: Observable<FundingModel | string | null> =
    this.searchControl.valueChanges.pipe(takeUntilDestroyed());

  constructor() {
    this.selected$
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this._onChange(value));
  }

  ngAfterViewInit() {
    this._viewErrors.changes.subscribe((change) =>
      this.searchControl.markAsTouched(),
    );
  }

  _displayFundingModelInfo(fundingModel: FundingModel | string) {
    if (fundingModel instanceof FundingModel) {
      return fundingModel.name;
    }
    return fundingModel;
  }

  writeValue(obj: FundingModel | string | null): void {
    this.searchControl.setValue(obj || '');
  }
  _onChange = (value: FundingModel | string | null) => {};
  registerOnChange(fn: any): void {
    this._onChange = fn;
  }
  _onTouched = () => {};
  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }
  setDisabledState = disabledStateToggler(this.searchControl);
}
