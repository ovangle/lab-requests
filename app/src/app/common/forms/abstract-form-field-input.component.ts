import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { throwDialogContentAlreadyAttachedError } from "@angular/cdk/dialog";
import { P } from "@angular/cdk/keycodes";
import { ThisReceiver } from "@angular/compiler";
import { DestroyRef, Directive, HostBinding, Inject, Injectable, InjectionToken, Input, Provider, Type, TypeProvider, effect, forwardRef, inject, input, model, ɵINPUT_SIGNAL_BRAND_WRITE_TYPE } from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { AbstractControlDirective, ControlValueAccessor, FormControlStatus, NG_VALUE_ACCESSOR, NgControl } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { BehaviorSubject, Connectable, Observable, Subscription, combineLatest, connectable, defer, distinctUntilChanged, distinctUntilKeyChanged, filter, map, mapTo, onErrorResumeNextWith, shareReplay, skipWhile, take, tap } from "rxjs";
import { requiresAuthorizationGuard } from "src/app/utils/router-utils";

const maxControlTypeIds = new Map<string, number>();

function nextControlId(controlType: string) {
    const nextId = maxControlTypeIds.get(controlType) || 1;

    return `${controlType}-${nextId}`;
}

export const FORM_INPUT_CONTROL_TYPE = new InjectionToken<string>('FORM_INPUT_CONTROL_TYPE');
export function formFieldInputProviders<T extends AbstractFormFieldInput<any>>(
    controlType: string,
    componentType: Type<T>
): Provider[] {
    return [
        { provide: FORM_INPUT_CONTROL_TYPE, useValue: controlType },
        { provide: NG_VALUE_ACCESSOR, useExisting: componentType, multi: true },
        { provide: AbstractFormFieldInput, useExisting: componentType },
        { provide: MatFormFieldControl, useExisting: componentType },
    ];
}

export interface FormFieldState {
    touched: boolean;
    required: boolean;
    placeholder: string;
    focused: boolean;
    empty: boolean;
    shouldLabelFloat: boolean;
    disabled: boolean;
    errorState: boolean;
    describedByIds: readonly string[];
}

function _formFieldStateSubject(): BehaviorSubject<FormFieldState> {
    return new BehaviorSubject<FormFieldState>({
        touched: false,
        placeholder: '',
        focused: false,
        required: false,
        disabled: false,
        errorState: false,
        empty: false,
        shouldLabelFloat: false,
        describedByIds: []
    });
}

@Injectable()
export class AbstractFormFieldInput<TValue>
    implements MatFormFieldControl<TValue>, ControlValueAccessor {
    readonly _subscriptions: Subscription[] = [];

    readonly input = inject(AbstractFormFieldInput<TValue>);
    readonly ngControl = inject(NgControl);

    readonly controlType: string;
    readonly id: string;

    constructor() {
        this.controlType = inject(FORM_INPUT_CONTROL_TYPE);
        this.id = nextControlId(this.controlType);

        inject(DestroyRef).onDestroy(() => {
            this._stateSubject.complete();
        });
    }

    // Implementations should call this when the input should be considered "touched".
    touch(): void {
        this.setState({ touched: true });
    }

    setDescribedByIds(ids: string[]): void {
        this.setState({ describedByIds: [...ids] });
    }
    onContainerClick(event: MouseEvent): void {
        throw new Error("Method not implemented.");
    }
    protected readonly _stateSubject = _formFieldStateSubject();
    // the configurable FormFieldState of the control
    readonly state$ = this._stateSubject.asObservable();

    // The value of the control.
    protected readonly _valueSubject = new BehaviorSubject<TValue | null>(null);
    readonly value$ = this._valueSubject.asObservable();

    get value(): TValue | null { return this._valueSubject.value; }
    writeValue(value: TValue | null) {
        this._valueSubject.next(value);
    }

    registerOnChange(fn: (value: any) => void) {
        const subscription = this._valueSubject.subscribe(fn);
        this._subscriptions.push(subscription);
    }

    registerOnTouched(fn: () => void) {
        const subscription = this._stateSubject.pipe(
            filter(s => !!s.touched),
            distinctUntilChanged()
        ).subscribe(fn);
        this._subscriptions.push(subscription);
    }

    getState<K extends keyof FormFieldState>(k: K): FormFieldState[K] {
        return this._stateSubject.value[k];
    }
    setState(...partials: Partial<FormFieldState>[]) {
        this._stateSubject.next(
            Object.assign({}, this._stateSubject.value, ...partials)
        );
    }

    get required() { return this.getState('required'); }
    get placeholder() { return this.getState('placeholder'); }
    get focused() { return this.getState('focused'); }
    get empty() { return this.getState('empty'); }
    get shouldLabelFloat() { return this.getState('shouldLabelFloat'); }
    get disabled() { return this.getState('disabled'); }
    get errorState() { return this.getState('errorState'); }
    get describedByIds() { return this.getState('describedByIds'); }

    readonly valueChanges = this._valueSubject.pipe(map(() => undefined));
    readonly stateChanges = this._stateSubject.pipe(map(() => undefined));

}
