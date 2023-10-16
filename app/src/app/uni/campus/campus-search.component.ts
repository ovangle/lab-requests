import { Component, HostBinding, inject } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, filter, map, of, startWith, switchMap } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { MatInputModule } from "@angular/material/input";
import { CampusInfoComponent } from "./campus-info.component";
import { Campus, CampusService } from "./common/campus";

@Component({
    selector: 'uni-campus-search',
    standalone: true,
    imports: [
        CommonModule,

        ReactiveFormsModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,

        CampusInfoComponent
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

    <mat-autocomplete #autocomplete [displayWith]="_displayCampusInfo">
        <mat-option *ngFor="let campus of (searchResults$ | async)" [value]="campus">
            <uni-campus-info [campus]="campus"></uni-campus-info>
        </mat-option>
    </mat-autocomplete>
    `,
    styles: [`
    .mat-form-field {
        width: 100%;
    }
    `],
    providers: [
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: CampusSearchComponent }
    ]
})
export class CampusSearchComponent implements ControlValueAccessor {
    
    readonly campusService = inject(CampusService);

    readonly searchControl = new FormControl<Campus | string>('', {nonNullable: true});
    readonly searchResults$: Observable<Campus[]> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        startWith(null),
        switchMap(nameOrCampus => {
            if (nameOrCampus == null) {
                return of([]);
            } else if (nameOrCampus instanceof Campus) {
                return of([nameOrCampus]);
            } else {
                return this.campusService.query({code: nameOrCampus}); 
            }
        })
    );

    readonly selectedCampus$: Observable<Campus | null> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        map(value => {
            if (value instanceof Campus) {
                return value;
            }
            return null;
        })
    );

    get hasSelectedValue() {
        return this.searchControl.value instanceof Campus;
    }

    @HostBinding('[attr.required]')
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
    }
    _required: boolean;

    reset() {
        this.searchControl.setValue('');
        this._onChange(null);
    }

    constructor() {
        this.searchControl.valueChanges.pipe(
            takeUntilDestroyed(),
            filter((value): value is Campus => value instanceof Campus),
        ).subscribe((value) => this._onChange(value))
    }

    _displayCampusInfo(campus: Campus) {
        if (campus instanceof Campus) {
            return `${campus.code} - ${campus.name}`
        }
        return campus;
    }

    writeValue(value: Campus | string | null): void {
        this.searchControl.setValue(value || '');
    }
    _onChange = (value: any) => {}
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this.searchControl);
}
