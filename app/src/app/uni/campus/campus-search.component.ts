import { Component, HostBinding, Input, NgModule, inject } from "@angular/core";
import { Campus, CampusModelService, isCampus } from "./campus";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, Observable, filter, map, of, startWith, switchMap } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { CampusCreateFormComponent } from "./campus-create-form.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

@Component({
    selector: 'app-uni-campus-search-label',
    template: `
    <ng-content></ng-content>
    `
})
export class CampusSearchLabelComponent {}

@Component({
    selector: 'app-uni-campus-search-option',
    template: `
    <span class="campus-code">{{campus.code}}</span> 
    - <span class="campus-name">{{campus.name}}</span> 
    `
})
export class CampusSearchOptionComponent {
    @Input()
    campus: Campus;
}

@Component({
    selector: 'app-uni-campus-search',
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="app-uni-campus-search-label"></ng-content>
        </mat-label>

        <input matInput [matAutocomplete]="autocomplete" 
                        [formControl]="searchControl" 
                        [required]="required" />
                    
        <mat-error *ngIf="required && !hasSelectedValue">
            A value is required
        </mat-error>
    </mat-form-field>

    <mat-autocomplete #autocomplete [displayWith]="_displayCampusInfo">
        <mat-option *ngFor="let campus of (searchResults$ | async)" [value]="campus">
            <app-uni-campus-search-option 
                 [campus]="campus">
            </app-uni-campus-search-option>
        </mat-option>
    </mat-autocomplete>
    `,
    providers: [
        CampusModelService,
        { provide: NG_VALUE_ACCESSOR, multi: true, useExisting: CampusSearchComponent }
    ]
})
export class CampusSearchComponent implements ControlValueAccessor {
    
    readonly campusService = inject(CampusModelService);

    readonly searchControl = new FormControl<Campus | string>('', {nonNullable: true});
    readonly searchResults$: Observable<Campus[]> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        startWith(null),
        switchMap(nameOrCampus => {
            if (isCampus(nameOrCampus)) {
                return of([nameOrCampus]);
            } else {
                return this.campusService.searchCampuses(nameOrCampus); 
            }
        })
    );

    readonly selectedCampus$: Observable<Campus | null> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        map(value => isCampus(value) ? value : null)
    )

    get hasSelectedValue() {
        return !isCampus(this.searchControl.value);
    }

    @HostBinding('[attr].required')
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
        ).subscribe(this._onChange)
    }

    _displayCampusInfo(campus: Campus) {
        if (isCampus(campus)) {
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
