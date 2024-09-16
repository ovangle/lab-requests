import { ChangeDetectionStrategy, Component, contentChild, ContentChild, DestroyRef, effect, inject, input, Input, viewChild } from "@angular/core";
import { ModelSearchControl, NotFoundValue } from "./search-control";
import { ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldControl, MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInput, MatInputModule } from "@angular/material/input";
import { ModelSearchAutocompleteComponent } from "./search-autocomplete.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { BehaviorSubject, distinctUntilChanged, first, Observable } from "rxjs";
import { Model } from "../model";

@Component({
    selector: 'common-model-search-input',
    standalone: true,
    imports: [
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatAutocompleteModule
    ],
    template: `
    @if (modelSearchAutocomplete(); as _autocomplete) {
        <input matInput
               [formControl]="searchControl().formControl"
               [matAutocomplete]="_autocomplete.matAutocomplete()"
               [required]="required"
               (focus)="this.focusedSubject.next(true)"
               (blur)="this.focusedSubject.next(false)" />
    } @else {
        <input matInput [formControl]="searchControl().formControl"
               [required]="required"
               (focus)="focusedSubject.next(true)"
               (blur)="focusedSubject.next(false)" />
    }

    <ng-content select="common-search-autocomplete" />
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelSearchInputComponent<T extends Model> {
    searchControl = input.required<ModelSearchControl<T>>();
    modelSearchAutocomplete = input<ModelSearchAutocompleteComponent<T>>();

    _required = input(false, { transform: coerceBooleanProperty, alias: 'required' });
    get required() {
        return this._required();
    }

    _matInput = viewChild.required(MatInput);

    constructor() {
        effect(() => {
            const inputFocused = this._matInput().focused;
            if (inputFocused !== this.focused) {
                this.focusedSubject.next(inputFocused);
            }
        })

        inject(DestroyRef).onDestroy(() => {
            this.focusedSubject.complete();
        });
    }


    readonly focusedSubject = new BehaviorSubject(false);
    get focused() {
        return this.focusedSubject.value;
    }

    focus() {
        this._matInput().focus();
    }
}