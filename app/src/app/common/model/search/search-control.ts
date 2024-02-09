import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { inject, ChangeDetectorRef, Input, Output, Type } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Observable, startWith, switchMap, of, shareReplay, filter, withLatestFrom, map } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { Model } from "../model";

export class NotFoundValue {
    constructor(readonly searchInput: string) {
    }
}

const __NOT_FOUND__ = { _label: '_NOT_FOUND_' };
type _NOT_FOUND = typeof __NOT_FOUND__;

export function isNotFound(obj: unknown): obj is _NOT_FOUND {
    return typeof obj === 'object'
        && obj != null
        && (obj as any)._label === '_NOT_FOUND_';
}

export interface ModelSearchComponent<T extends Model> {
    readonly searchControl: ModelSearchControl<T>;
}

export function provideValueAccessor<T extends ModelSearchComponent<any>>(componentType: Type<T>) {
    return {
        provide: NG_VALUE_ACCESSOR,
        multi: true,
        useFactory: (component: T) => component.searchControl,
        deps: [ componentType ]
    };

}

export class ModelSearchControl<T extends Model> implements ControlValueAccessor {
    readonly __NOT_FOUND__ = __NOT_FOUND__;

    readonly _cd = inject(ChangeDetectorRef);

    readonly searchControl = new FormControl<T | _NOT_FOUND | string>('', { nonNullable: true });

    allowNotFound: boolean = false;

    constructor(
        readonly getModelOptions: (search: string) => Observable<T[]>,
        readonly formatModel: (model: T) => string,
    ) {
        this.value$.pipe(
            takeUntilDestroyed()
        ).subscribe((v) => this._onChange(v));
    }


    readonly modelOptions$: Observable<T[]> = this.searchControl.valueChanges.pipe(
        startWith(''),
        switchMap(search => {
            if (typeof search === 'string') {
                return this.getModelOptions(search);
            } else if (isNotFound(search)) {
                return of([]);
            } else {
                return of([ search ]);
            }
        }),
        shareReplay(1)
    );

    _searchInput$: Observable<string> = this.searchControl.valueChanges.pipe(
        filter((value): value is string => typeof value !== 'string')
    );

    value$: Observable<T | NotFoundValue> = this.searchControl.valueChanges.pipe(
        filter(value => {
            return typeof value !== 'string' || isNotFound(value)
        }),
        withLatestFrom(this._searchInput$),
        map(([ value, searchInput ]) => isNotFound(value) ? new NotFoundValue(searchInput) : value as T),
        shareReplay(1)
    );

    writeValue(obj: T | NotFoundValue | null): void {
        if (obj instanceof NotFoundValue) {
            this.searchControl.setValue(__NOT_FOUND__);
        } else if (obj === null) {
            this.searchControl.setValue('')
        } else {
            this.searchControl.setValue(obj);
        }
    }
    _onChange = (value: T | NotFoundValue) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this.searchControl);

    reset() {
        this.searchControl.setValue('');
    }

    displayValue(value: T | _NOT_FOUND) {
        if (isNotFound(value)) {
            return '---';
        } else {
            return this.formatModel(value);
        }
    }
}