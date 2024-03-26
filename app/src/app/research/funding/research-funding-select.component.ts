import { ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
import {
  ResearchFunding,
  ResearchFundingService,
} from './research-funding';
import { Observable, map, of, shareReplay, tap } from 'rxjs';
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
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

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
      <mat-select [formControl]="formControl" [required]="required" [compareWith]="_compareOptions">
        @if (options$ | async; as options) {
          @for (option of options; track option.id) {
            <mat-option [value]="option">{{ option.name }}</mat-option>
          }
        }
      </mat-select>

      <div matIconSuffix>
        <ng-content select="[matIconSuffix]"></ng-content>
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
      useExisting: ResearchFundingSelectComponent,
    },
  ],
})
export class ResearchFundingSelectComponent implements ControlValueAccessor {
  readonly userContext = inject(UserContext);

  readonly researchFundings = inject(ResearchFundingService);
  readonly options$: Observable<ResearchFunding[]> = this.researchFundings.all().pipe(
    shareReplay(1),
    tap((options) => {
      console.log('setting options');
      console.log('form value', this.formControl.value);
      for (const option of options) {
        console.log(option === this.formControl.value);
      }
    })
  );

  @Input()
  get required(): boolean {
    return this._required;
  }
  set required(value: BooleanInput) {
    this._required = coerceBooleanProperty(value);
  }
  _required: boolean = false;

  readonly formControl = new FormControl<ResearchFunding | null>(null);

  // Coerce control value into ResearchFundingLookup or null
  readonly value$: Observable<ResearchFunding | null> = this.formControl.valueChanges.pipe(
    takeUntilDestroyed(),
    map(value => {
      if (value instanceof ResearchFunding) {
        return value;
      }
      return null;
    })
  );

  writeValue(obj: ResearchFunding | null): void {
    if (!(obj instanceof ResearchFunding) || obj == null) {
      throw new Error('Expected a ResearchFunding or null');
    }
    this.formControl.setValue(obj);
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

  _compareOptions(a: ResearchFunding | null, b: ResearchFunding | null) {
    return a?.id === b?.id;
  }
}
