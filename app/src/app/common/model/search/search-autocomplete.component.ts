import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, ViewChild, computed, inject, input, viewChild } from "@angular/core";
import { MatAutocomplete, MatAutocompleteModule } from "@angular/material/autocomplete";
import { ModelSearchControl, NotFoundValue } from "./search-control";
import { ModelSearchInputComponent } from "./search-input.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { toObservable } from "@angular/core/rxjs-interop";
import { switchMap } from "rxjs";
import { Model, modelId, ModelRef } from "../model";

@Component({
    selector: 'common-model-search-autocomplete',
    standalone: true,
    imports: [
        CommonModule,
        MatAutocompleteModule
    ],
    template: `
    <mat-autocomplete [displayWith]="displayValue" >
        @if (modelOptions$ | async; as modelOptions) {
            @for (model of modelOptions; track model.id) {
                <mat-option [value]="model" [disabled]="_disabledOptionIds().includes(model.id)">
                    {{searchControl().formatModel(model)}}
                </mat-option>
            }
        }

        @if (allowNotFound()) {
            <mat-option [value]="searchControl().__NOT_FOUND__">
                @if (notFoundTemplate(); as notFoundTemplate) {
                    <ng-container *ngTemplateOutlet="notFoundTemplate" />
                } @else {
                    <p>A value was not found</p>
                }
            </mat-option>
        }
    </mat-autocomplete>
    `

})
export class ModelSearchAutocompleteComponent<T extends Model> {
    searchControl = input.required<ModelSearchControl<T>>();
    disabledOptions = input<ModelRef<T>[]>([]);
    _disabledOptionIds = computed(() => this.disabledOptions().map(m => modelId(m)));

    readonly modelOptions$ = toObservable(this.searchControl).pipe(
        switchMap(control => control.modelOptions$)
    );

    matAutocomplete = viewChild.required(MatAutocomplete);

    allowNotFound = input(false, { transform: coerceBooleanProperty })
    notFoundTemplate = input<TemplateRef<any>>();

    displayValue = (value: any) => {
        return this.searchControl().displayValue(value);
    }

}