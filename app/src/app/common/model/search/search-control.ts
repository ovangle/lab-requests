import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { inject, ChangeDetectorRef, Input, Output, Type, DestroyRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from "@angular/forms";
import { Observable, startWith, switchMap, of, shareReplay, filter, withLatestFrom, map, BehaviorSubject, connectable, Connectable, firstValueFrom, first, skipWhile } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { Model, ModelQuery } from "../model";

export class NotFoundValue {
    constructor(readonly searchInput: string) {
    }
}

const __NOT_FOUND__ = { _label: '_NOT_FOUND_' };
type _NOT_FOUND = typeof __NOT_FOUND__;

export function is_NOT_FOUND(obj: unknown): obj is _NOT_FOUND {
    return typeof obj === 'object'
        && obj != null
        && (obj as any)._label === '_NOT_FOUND_';
}

export interface ModelSearchComponent<T extends Model> {
    readonly searchControl: ModelSearchControl<T>;
}

export function provideModelSearchValueAccessor<T extends ModelSearchComponent<any>>(componentType: Type<T>) {
    return {
        provide: NG_VALUE_ACCESSOR,
        multi: true,
        useFactory: (component: T) => component.searchControl,
        deps: [ componentType ]
    };

}

export class ModelSearchControl<T extends Model, TQuery extends ModelQuery<T> = ModelQuery<T>> implements ControlValueAccessor {
    readonly __NOT_FOUND__ = __NOT_FOUND__;

    readonly _destroyRef = inject(DestroyRef);
    readonly _cd = inject(ChangeDetectorRef);

    readonly searchControl = new FormControl<T | _NOT_FOUND | string>('', { nonNullable: true });

    allowNotFound: boolean = false;

    constructor(
        readonly getModelOptions: (search: string) => Observable<T[]>,
        readonly formatModel: (model: T) => string,
        readonly formatNotFoundValue: (v: NotFoundValue) => string = (_: any) => '---'
    ) {
        this.value$.pipe(
            takeUntilDestroyed()
        ).subscribe(v => this._onChange(v));
    }

    readonly modelOptions$: Observable<T[]> = this.searchControl.valueChanges.pipe(
        startWith(''),
        switchMap(search => {
            if (typeof search === 'string') {
                return this.getModelOptions(search);
            } else if (is_NOT_FOUND(search)) {
                return of([]);
            } else {
                return of([ search ]);
            }
        }),
        shareReplay(1)
    );

    _searchInput$: Observable<string> = this.searchControl.valueChanges.pipe(
        filter((value): value is string => typeof value === 'string'),
    );
    get searchInput() {
        return this.searchControl.value!;
    }
    setSearchInput(searchInput: string) {
        this.searchControl.setValue(searchInput);
    }

    query$: Observable<Partial<TQuery>> = this._searchInput$.pipe(
        map(search => ({ search } as Partial<TQuery>))
    );

    value$: Observable<T | NotFoundValue> = this.searchControl.valueChanges.pipe(
        filter(value => {
            return typeof value !== 'string' || is_NOT_FOUND(value)
        }),
        withLatestFrom(this._searchInput$),
        map(([ value, searchInput ]) => {
            console.log('value', value, 'searchInput', searchInput)
            return is_NOT_FOUND(value) ? new NotFoundValue(searchInput) : value as T
        }),
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

    _lastValue: string = '';
    displayValue(value: string | T | _NOT_FOUND): string {
        if (typeof value === 'string') {
            return this._lastValue = value;
        } if (is_NOT_FOUND(value)) {
            const v = new NotFoundValue(this._lastValue);
            return this.formatNotFoundValue(v);
        } else {
            return this.formatModel(value);
        }
    }
}