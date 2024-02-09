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
                    [formControl]="search!.searchControl" 
                    [matAutocomplete]="_autocomplete.autocomplete!" 
                    [required]="required"/>
        } @else {
            <input matInput [formControl]="search!.searchControl" 
                    [required]="required" />
        }

        <button mat-icon-button matIconSuffix (click)="search!.reset()">
            <mat-icon>clear</mat-icon>
        </button>

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

    @ContentChild(ModelSearchAutocompleteComponent)
    _autocomplete: ModelSearchAutocompleteComponent | undefined;
}