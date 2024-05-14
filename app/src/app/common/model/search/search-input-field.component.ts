import { Component, ContentChild, Input } from "@angular/core";
import { ModelSearchControl } from "./search-control";
import { ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { ModelSearchAutocompleteComponent } from "./search-autocomplete.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { distinctUntilChanged, first } from "rxjs";

@Component({
    selector: 'common-model-search-input-field',
    standalone: true,
    imports: [
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule
    ],
    template: `
    <mat-form-field>
        <mat-label><ng-content select="mat-label" /></mat-label>
        @if (_autocomplete) {
            <input matInput 
                (focus)="_onSearchInputFocus()"
                    [formControl]="search!.searchControl" 
                    [matAutocomplete]="_autocomplete.autocomplete!" 
                    [required]="required"/>
        } @else {
            <input matInput [formControl]="search!.searchControl" 
                    (focus)="_onSearchInputFocus()"
                    [required]="required" />
        }

        @if (!hideSearchPrefixIcon) {
            <span matIconPrefix><mat-icon>search</mat-icon></span>
        }

        @if (!clearOnFocus) {
            <button mat-icon-button matIconSuffix (click)="search!.reset()">
                <mat-icon>clear</mat-icon>
            </button>
        }
        <div matIconSuffix>
            <ng-content select="[matIconSuffix]">
            </ng-content>
        </div>

        <ng-content select="common-search-autocomplete" />
    </mat-form-field>
    `
})
export class ModelSearchInputComponent {
    @Input({ required: true })
    search: ModelSearchControl<any> | undefined;

    @Input()
    get required(): boolean {
        return this._required;
    }
    set required(value: BooleanInput) {
        this._required = coerceBooleanProperty(value);
    }
    _required: boolean = false;

    @Input()
    get clearOnFocus(): boolean {
        return this._clearOnFocus;
    }
    set clearOnFocus(value: BooleanInput) {
        this._clearOnFocus = coerceBooleanProperty(value);
    }
    _clearOnFocus: boolean = false;
    _valueChangedSinceLastClear = false;

    @Input()
    get hideSearchPrefixIcon() {
        return this._hideSearchPrefixIcon;
    }
    set hideSearchPrefixIcon(value: BooleanInput) {
        this._hideSearchPrefixIcon = coerceBooleanProperty(value);
    }
    _hideSearchPrefixIcon = false;


    @ContentChild(ModelSearchAutocompleteComponent)
    _autocomplete: ModelSearchAutocompleteComponent | undefined;

    _onSearchInputFocus() {

        if (this.clearOnFocus && this._valueChangedSinceLastClear) {
            this.search?.searchControl.reset();

            // Choosing a value from the autocomplete refocuses the element, triggering a clear of the input.
            // If we clear once, wait until a value is selected before we clear again.
            this._valueChangedSinceLastClear = false;

            this.search?.searchControl.valueChanges.pipe(
                distinctUntilChanged(),
                first()
            ).subscribe(() => {
                this._valueChangedSinceLastClear = true;
            });
        }
    }
}