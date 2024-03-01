import { CommonModule } from "@angular/common";
import { Component, Input, TemplateRef, ViewChild, inject } from "@angular/core";
import { MatAutocomplete, MatAutocompleteModule } from "@angular/material/autocomplete";
import { ModelSearchControl } from "./search-control";
import { ModelSearchInputComponent } from "./search-input-field.component";
import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";

@Component({
    selector: 'common-model-search-autocomplete',
    standalone: true,
    imports: [
        CommonModule,
        MatAutocompleteModule
    ],
    template: `
    <mat-autocomplete [displayWith]="displayValue">
        @if (search!.modelOptions$ | async; as modelOptions) {
            @for (model of modelOptions; track model.id) {
                <mat-option [value]="model">
                    {{search!.formatModel(model)}}
                </mat-option>
            }
        }

        @if (search!.allowNotFound) {
            <mat-option [value]="search!.__NOT_FOUND__">
                @if (notFoundTemplate) {
                    <ng-container *ngTemplateOutlet="notFoundTemplate" />
                } @else {
                    A value was not found
                }
            </mat-option>
        }
    </mat-autocomplete>
    `

})
export class ModelSearchAutocompleteComponent {
    readonly inputComponent = inject(ModelSearchInputComponent);
    get search(): ModelSearchControl<any> | undefined {
        return this.inputComponent.search;
    }

    @Input()
    get allowNotFound() {
        return this.search!.allowNotFound;
    }
    set allowNotFound(input: BooleanInput) {
        this.search!.allowNotFound = coerceBooleanProperty(input);
    }

    @Input()
    notFoundTemplate: TemplateRef<any> | undefined;

    @ViewChild(MatAutocomplete, { static: true })
    autocomplete: MatAutocomplete | undefined;

    displayValue = (value: any) => {
        return this.search!.displayValue(value);
    }
}