import { ChangeDetectionStrategy, Component, DestroyRef, Directive, HostBinding, Injectable, InjectionToken, Input, Provider, Type, contentChild, effect, inject, input, model, viewChild } from "@angular/core";
import { StorageType, STORAGE_TYPES } from "./lab-storage-type";

import { AbstractFormFieldInput, formFieldInputProviders } from "src/app/common/forms/abstract-form-field-input.component";
import { AbstractEnumSelectComponent } from "src/app/common/model/forms/abstract-enum-select.component";
import { MatSelect, MatSelectModule } from "@angular/material/select";

import { StorageTypePipe } from "./lab-storage-type.pipe";
import { LabContext } from "../lab-context";
import { Observable, of, map, take, firstValueFrom, BehaviorSubject, combineLatest, shareReplay } from "rxjs";
import { outputFromObservable, toSignal } from "@angular/core/rxjs-interop";
import { AsyncPipe } from "@angular/common";
import { MatFormFieldControl } from "@angular/material/form-field";
import { NgControl, AbstractControlDirective, ControlValueAccessor } from "@angular/forms";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { Lab } from "../lab";

var __id = 0;
function _nextId() {
    return __id++;
}


@Component({
    selector: 'lab-storage-type-select',
    standalone: true,
    imports: [
        AsyncPipe,
        MatSelectModule,
        StorageTypePipe
    ],
    template: `
    <mat-select [value]="_value()"
                (valueChange)="_value.set($event)"
                [required]="_required()">
    @for (value of STORAGE_TYPE_VALUES; track value) {
        <mat-option [value]="value">
            {{value | labStorageType}}

            @if (isValueDisabled(value) | async) {
                <em>disabled</em>
            } @else {
                <em>enabled</em>
            }

        </mat-option>
    }
    </mat-select>
    `,
    providers: [
        { provide: MatFormFieldControl, useExisting: StorageTypeSelectComponent }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorageTypeSelectComponent implements MatFormFieldControl<StorageType>, ControlValueAccessor {
    readonly controlType = 'lab-storage-type-select';
    readonly id: string;

    readonly _value = model<StorageType | null>(null, { alias: 'value' });
    get value() { return this._value(); }

    readonly _required = input(false, { transform: coerceBooleanProperty, alias: 'required' });
    get required() {
        return this._required();
    }

    readonly ngControl = inject(NgControl, { self: true, optional: true });
    readonly _matSelect = viewChild.required(MatSelect);

    constructor() {
        this.id = `${this.controlType}-${_nextId()}`

        effect(() => {
            this._onChange(this._value())
        });


        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }
    }

    get errorState() {
        if (this.required) {
            return this._value() != null;
        }
        return false;
    }

    get placeholder() { return ''; }

    get focused() {
        return this._matSelect().focused;
    }
    focus(focusOptions?: FocusOptions) {
        this._matSelect().focus(focusOptions)
    }

    get empty() {
        return this._value() != null;
    }

    get shouldLabelFloat() {
        return this._matSelect().shouldLabelFloat;
    }

    get disabled() {
        return this._matSelect().disabled;
    }

    describedByIdsSubject = new BehaviorSubject<string[]>([]);
    setDescribedByIds(ids: string[]): void {
        this.describedByIdsSubject.next(ids);
    }

    readonly stateChanges = combineLatest([
        toObservable(this._required).pipe()
        this.describedByIdsSubject
    ]).pipe(
        map(() => undefined)
    );

    onContainerClick(event: MouseEvent): void {
        this._matSelect().focus();
    }
    readonly STORAGE_TYPE_VALUES = STORAGE_TYPES;


    readonly _labContext = inject(LabContext, { optional: true });
    readonly lab$ = (this._labContext ? this._labContext.committed$ : of<Lab | null>(null)).pipe(
        shareReplay(1)
    );

    readonly _enabledValues = this.lab$.pipe(
        map(lab => lab == null ? this.STORAGE_TYPE_VALUES : lab.storageTypes)
    )

    async isValueDisabled(value: StorageType) {
        const lab = await firstValueFrom(this.lab$);
        if (lab == null) {
            return false;
        }
        return lab.storageTypes.includes(value);
    }

    writeValue(value: any) {
        this._value.set(value);
    }

    _onChange = (value: StorageType | null) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean) {
        this._matSelect().setDisabledState(isDisabled);
    }
}