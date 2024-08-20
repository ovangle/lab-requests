import { ChangeDetectionStrategy, Component, DestroyRef, Directive, HostBinding, Injectable, InjectionToken, Input, Provider, Type, ViewEncapsulation, contentChild, effect, inject, input, model, viewChild } from "@angular/core";
import { StorageType, STORAGE_TYPES, formatStorageType } from "./lab-storage-type";

import { AbstractFormFieldInput, formFieldInputProviders } from "src/app/common/forms/abstract-form-field-input.component";
import { modelEnumMetaProviders, ModelEnumSelect } from "src/app/common/model/forms/abstract-enum-select.component";
import { ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: 'lab-storage-type-select',
    standalone: true,
    imports: [
        ReactiveFormsModule,

        ModelEnumSelect
    ],
    viewProviders: [
        ...modelEnumMetaProviders({
            name: 'storage-type',
            values: STORAGE_TYPES,
            formatValue: formatStorageType,

        })
    ],
    providers: [
        ...formFieldInputProviders('lab-storage-type-select', StorageTypeSelect)
    ],
    template: `<common-model-enum-select 
                    [formControl]="formControl" 
                    [required]="required"
                    [placeholder]="placeholder"
               />`,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageTypeSelect extends AbstractFormFieldInput<StorageType> {
    readonly STORAGE_TYPE_VALUES = STORAGE_TYPES;

}