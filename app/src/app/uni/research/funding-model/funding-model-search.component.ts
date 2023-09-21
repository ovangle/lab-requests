import { CommonModule } from "@angular/common";
import { Component, HostBinding, inject } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FundingModelInfoComponent } from "./funding-model-info.component";
import { FundingModel, FundingModelService } from "./funding-model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, map, of, startWith, switchMap } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { MatInputModule } from "@angular/material/input";


@Component({
    selector: 'uni-research-funding-model-search',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,

        FundingModelInfoComponent
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="mat-label"></ng-content>
        </mat-label>

        <input matInput [matAutocomplete]="autocomplete"
                        [formControl]="searchControl"
                        [required]="required" />

        <mat-error>
            <ng-content select="mat-error"></ng-content>
        </mat-error>
    </mat-form-field>

    <mat-autocomplete #autocomplete [displayWith]="_displayFundingModelInfo">
        <mat-option *ngFor="let fundingModel of (searchResults$ | async)"
                    [value]="fundingModel">
            <uni-research-funding-model-info [fundingModel]="fundingModel" nameonly>
            </uni-research-funding-model-info>
        </mat-option>
    </mat-autocomplete>
    `,
    providers: [
        { 
            provide: NG_VALUE_ACCESSOR, 
            multi: true,
            useExisting: FundingModelSearchComponent
        }
    ]
})
export class FundingModelSearchComponent implements ControlValueAccessor {
    readonly fundingModelService = inject(FundingModelService);

    readonly searchControl = new FormControl<FundingModel | string>('', {nonNullable: true});

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
        switchMap(nameOrFundingModel => {
            if (nameOrFundingModel instanceof FundingModel) {
                return of([nameOrFundingModel]);
            } else {
                return this.fundingModelService.search(nameOrFundingModel);
            }
        })
    );

    readonly selected$: Observable<FundingModel | null> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        map(value => value instanceof FundingModel ? value : null)
    );

    _displayFundingModelInfo(fundingModel: FundingModel | string) {
        if (fundingModel instanceof FundingModel) {
            return fundingModel.name;
        }
        return fundingModel;
    }

    writeValue(obj: FundingModel | string | null): void {
        this.searchControl.setValue(obj || '');
    }
    _onChange: (value: FundingModel | null) => void;
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched: () => void;
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this.searchControl);
}