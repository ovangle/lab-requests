import { Component, NgModule, inject } from "@angular/core";
import { Campus, CampusService, campusServiceProviders, isCampus } from "./campus";
import { ControlValueAccessor, FormControl, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Observable, of, switchMap } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { CampusCreateFormComponent } from "./campus-create-form.component";

@Component({
    selector: 'app-uni-campus-search-label',
    standalone: true,
    template: `
    <ng-content></ng-content>
    `
})
export class CampusSearchLabelComponent {}


@Component({
    selector: 'app-uni-campus-search',
    standalone: true,
    imports: [
        CommonModule, 
        ReactiveFormsModule,

        MatFormFieldModule,
        MatAutocompleteModule,

        CampusCreateFormComponent
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="app-uni-campus-search-label"></ng-content>
        </mat-label>

        <input matInput [matAutocomplete]="autocomplete" 
                        [formControl]="searchControl" />
    </mat-form-field>


    <mat-autocomplete #autocomplete>
        <ng-container *ngIf="searchResults$ | async as searchResults">
            <mat-option *ngFor="let campus of searchResults" [value]="campus">
                {{campus.name}}
            </mat-option>

            <mat-option (onSelectionChange)="this._noSelectableOption.next(true)">
                Other...
            </mat-option>
        </ng-container>
    </mat-autocomplete>

    <ng-container *ngIf="noSelectedCampus$ | async">
        <app-uni-campus-create-form [name]="searchControl.value"
            (committed)="this.searchControl.setValue($event); this._noSelectableOption.next(false)"
            (cancelled)="this._noSelectableOption.next(false)>
        </app-uni-campus-create-form>
    </ng-container>
    `,
    providers: [
        ...campusServiceProviders()
    ]
})
export class CampusSearchComponent implements ControlValueAccessor {
    
    readonly campusService = inject(CampusService);

    readonly searchControl = new FormControl<Campus | string>('', {nonNullable: true});
    readonly searchResults$: Observable<Campus[]> = this.searchControl.valueChanges.pipe(
        takeUntilDestroyed(),
        switchMap(nameOrCampus => {
            if (isCampus(nameOrCampus)) {
                return of([nameOrCampus]);
            } else {
                return this.campusService.searchCampuses(nameOrCampus);
            }
        })
    );

    readonly _noSelectableOption = new BehaviorSubject<boolean>(false);

    writeValue(value: Campus | string): void {
        this.searchControl.setValue(value);
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
