import { Component, Directive, InjectionToken, LOCALE_ID, Provider, contentChildren, forwardRef, inject, input, model, viewChild } from "@angular/core";
import { MatOption, MatSelect, MatSelectModule } from "@angular/material/select";
import { AbstractFormFieldInput, formFieldInputProviders } from "../../forms/abstract-form-field-input.component";
import { Observable, combineLatest, delay, distinctUntilChanged, map } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

export interface ModelEnumMeta<TEnum extends string> {
    name: string;
    values: ReadonlyArray<TEnum>;
    formatValue: (value: TEnum, locale: string | Locale) => string
}

export const MODEL_ENUM_META = new InjectionToken<ModelEnumMeta<any>>('MODEL_ENUM_META');

export function modelEnumMetaProviders<TEnum extends string>(meta: ModelEnumMeta<TEnum>): Provider[] {
    return [
        { provide: MODEL_ENUM_META, useValue: meta }
    ];
}

/**
 * Given an enum and enum values,
 * 
 * <common-enum-select [formControl]="control">
 *  @for (value of enumValues; track value) {
 *     <mat-option [value]="value" [disabled]="isValueDisabled(value)">
 *         {{value | enumPipe }}
 *     </mmat-option>
 *  }
 * </common-enum-select>
 */
@Component({
    selector: 'common-model-enum-select',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatSelectModule,
    ],
    providers: [
        ...formFieldInputProviders(
            'common-enum-select', forwardRef(() => ModelEnumSelect)
        )
    ],
    template: `
    <mat-select [formControl]="formControl">
        @for (optionValue of meta.values; track optionValue) {
            @let formattedValue = meta.formatValue(value, locale);

            <mat-option [value]="value" [disabled]="isDisabledOptionValue(optionValue)">
            
                {{formattedValue}}
            </mat-option>

        }
    </mat-select>
    `

})
export class ModelEnumSelect<TEnum extends string> extends AbstractFormFieldInput<TEnum> {
    readonly meta = inject(MODEL_ENUM_META)
    readonly locale = inject(LOCALE_ID)

    readonly options = contentChildren(MatOption);
    readonly _matSelect = viewChild.required(MatSelect);

    readonly disabledOptionValues = input<ReadonlySet<TEnum>>();

    isDisabledOptionValue(value: TEnum) {
        const disabledOptionValues = this.disabledOptionValues() || new Set<TEnum>();
        return disabledOptionValues.has(value);
    }

}