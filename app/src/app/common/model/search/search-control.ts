import { BooleanInput, coerceBooleanProperty } from "@angular/cdk/coercion";
import { inject, ChangeDetectorRef, Input, Output, Type, DestroyRef, Directive, input, viewChild, effect } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { AbstractControlDirective, ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from "@angular/forms";
import { Observable, startWith, switchMap, of, shareReplay, filter, withLatestFrom, map, BehaviorSubject, connectable, Connectable, firstValueFrom, first, skipWhile, tap, combineLatest, defer } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { Model, ModelQuery } from "../model";
import { MatFormFieldControl } from "@angular/material/form-field";
import { ModelService } from "../model-service";
import { ModelSearchInputComponent } from "./search-input.component";

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

@Directive()
export abstract class ModelSearchComponent<T extends Model> implements MatFormFieldControl<T | NotFoundValue> {

    abstract readonly controlType: string;
    abstract readonly id: string;

    readonly ngControl = inject(NgControl, { self: true });
    readonly searchInput = viewChild.required(ModelSearchInputComponent<T>);

    constructor(
        readonly searchControl: ModelSearchControl<T>
    ) {
        this.ngControl.valueAccessor = this.searchControl;

        effect(() => {
            const searchInput = this.searchInput();
            searchInput.focusedSubject.subscribe(this.focusedSubject);
        })

        inject(DestroyRef).onDestroy(() => {
            this.focusedSubject.complete();
        })
    }

    readonly focusedSubject = new BehaviorSubject(false);
    get focused() {
        return this.focusedSubject.value;
    }

    get empty() {
        return this.value == null;
    }

    get shouldLabelFloat() {
        return !this.empty || this.focused;
    }

    errorState = false;
    autofilled = true;
    userAriaDescribedBy = undefined;
    disableAutomaticLabeling = false;

    get value() { return this.searchControl.value; }
    get disabled() { return this.searchControl.disabled; }

    readonly placeholder = '';

    _required = input(false, { transform: coerceBooleanProperty, alias: 'required' });
    _required$ = toObservable(this._required);
    get required() { return this._required(); }

    readonly describedByIdsSubject = new BehaviorSubject<string[]>([]);
    setDescribedByIds(ids: string[]): void {
        this.describedByIdsSubject.next(ids);
    }
    onContainerClick(event: MouseEvent): void {
        this.searchInput().focus()
    }
    readonly stateChanges = defer(() => combineLatest([
        this.searchControl.valueChanges,
        this._required$,
        this.focusedSubject,
    ]).pipe(
        map(() => undefined)
    ));
}

export class ModelSearchControl<T extends Model, TQuery extends ModelQuery<T> = ModelQuery<T>> implements ControlValueAccessor {
    readonly __NOT_FOUND__ = __NOT_FOUND__;

    readonly _destroyRef = inject(DestroyRef);
    readonly _cd = inject(ChangeDetectorRef);

    readonly formControl = new FormControl<T | _NOT_FOUND | string>('', { nonNullable: true });

    constructor(
        readonly getModelOptions: (search: string) => Observable<T[]>,
        readonly formatModel: (model: T | NotFoundValue) => string,
    ) {
        this.valueChanges.pipe(
            takeUntilDestroyed()
        ).subscribe(v => this._onChange(v));
    }

    readonly modelOptions$: Observable<T[]> = this.formControl.valueChanges.pipe(
        startWith(''),
        switchMap(search => {
            if (typeof search === 'string') {
                return this.getModelOptions(search);
            } else if (is_NOT_FOUND(search)) {
                return of([]);
            } else {
                return of([search]);
            }
        }),
        tap(modelOptions => console.log('model options', modelOptions)),
        shareReplay(1)
    );

    _searchInput$: Observable<string> = this.formControl.valueChanges.pipe(
        filter((value): value is string => typeof value === 'string'),
    );
    get searchInput() {
        return this.formControl.value!;
    }
    setSearchInput(searchInput: string) {
        this.formControl.setValue(searchInput);
    }

    query$: Observable<Partial<TQuery>> = this._searchInput$.pipe(
        map(search => ({ search } as Partial<TQuery>))
    );

    private __value: T | NotFoundValue | null = null;
    valueChanges: Observable<T | NotFoundValue> = this.formControl.valueChanges.pipe(
        filter(value => {
            return typeof value !== 'string' || is_NOT_FOUND(value)
        }),
        withLatestFrom(this._searchInput$),
        map(([value, searchInput]) => {
            return is_NOT_FOUND(value) ? new NotFoundValue(searchInput) : value as T
        }),
        tap((v) => this.__value = v),
        shareReplay(1)
    );

    get value(): T | NotFoundValue | null {
        return this.__value;
    }

    writeValue(obj: T | NotFoundValue | null): void {
        if (obj instanceof NotFoundValue) {
            this.formControl.setValue(__NOT_FOUND__);
        } else if (obj === null) {
            this.formControl.setValue('')
        } else {
            this.formControl.setValue(obj);
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
    setDisabledState = disabledStateToggler(this.formControl);
    get disabled() { return this.formControl.disabled; }

    reset() {
        this.formControl.setValue('');
    }

    _lastValue: string = '';
    displayValue(value: string | T | _NOT_FOUND): string {
        if (typeof value === 'string') {
            return this._lastValue = value;
        } else if (is_NOT_FOUND(value)) {
            const v = new NotFoundValue(this._lastValue);
            return this.formatModel(v);
        } else {
            return this.formatModel(value);
        }
    }
}