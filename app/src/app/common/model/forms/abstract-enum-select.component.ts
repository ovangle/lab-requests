import { Component, Directive, InjectionToken, Provider, contentChildren, forwardRef, inject, input, model, viewChild } from "@angular/core";
import { MatOption, MatSelect, MatSelectModule } from "@angular/material/select";
import { AbstractFormFieldInput, formFieldInputProviders } from "../../forms/abstract-form-field-input.component";
import { Observable, combineLatest, delay, distinctUntilChanged, map } from "rxjs";
import { toObservable } from "@angular/core/rxjs-interop";

export interface ModelEnumMeta<TEnum> {
    name: string;
    values: TEnum[];
    formatDisplayValue: (value: TEnum, locale: Locale) => string
}

export const MODEL_ENUM_META = new InjectionToken<ModelEnumMeta>('MODEL_ENUM_META');

export function modelEnumMetaProviders<TEnum extends string>(meta: {
    name: string,
    values: TEnum[],
    iconName?: (value: TEnum) => string,
    formatValue: (value: TEnum, locale?: Locale) => string
}): Provider[] {
    return [
        { provide: MODEL_ENUM_VALUES, useValue: meta }
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
    selector: 'common-enum-select',
    standalone: true,
    imports: [
        MatSelectModule,
    ],
    providers: [
        ...formFieldInputProviders(
            'common-enum-select', forwardRef(() => AbstractEnumSelectComponent)
        )
    ],
    template: `
    <mat-select [value]="value">


    @for (optionValue of meta.values; track optionValue) {
        @let formattedValue = meta.formatValue(value);
        @let disabledValue = this.isDisabledValue(value); 

        <mat-option [value]="value" [disabled]="isDisabledValue(value)">
        
            {{formattedValue}}
        </mat-option>

    }

    
    </mat-select>
    `

})
export class ModelEnumSelect<TEnum extends string> extends AbstractFormFieldInput<TEnum> {
    readonly meta = inject(MODEL_ENUM_META)

    readonly options = contentChildren(MatOption);
    readonly _matSelect = viewChild.required(MatSelect);

    readonly disabledValues = input<ReadonlySet<TEnum>>();

    ngOnInit() {
        this.registerOnChange(value => {
            this._matSelect.setValue(value)
        })
    }
