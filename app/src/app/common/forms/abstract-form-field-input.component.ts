import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { ThisReceiver } from "@angular/compiler";
import { DestroyRef, Directive, HostBinding, Inject, Injectable, InjectionToken, Input, Provider, Type, TypeProvider, effect, forwardRef, inject, input, model, ɵINPUT_SIGNAL_BRAND_WRITE_TYPE } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { BehaviorSubject, Subscription, combineLatest, defer, distinctUntilChanged, filter, map, } from "rxjs";

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
        {
            provide: NG_VALUE_ACCESSOR,
            useFactory: (control: NgControl) => {
                if (control.valueAccessor == null) {
                    /* must be used in a reactive forms context */
                    throw new Error('Form field control has no value accessor');
                }
                return control.valueAccessor!;

            },
            deps: [NgControl],
            multi: true
        },
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

/**
 * Abstract base class for form input fields which are associated with
 * a single form field and which map to a single FormControl
 */
@Directive()
export abstract class AbstractFormFieldInput<TValue>
    implements MatFormFieldControl<TValue> {
    protected readonly _subscriptions: Subscription[] = [];

    readonly ngControl = inject(NgControl);
    get formControl() {
        if (this.ngControl.control instanceof FormControl) {
            return this.ngControl.control;
        }
        throw new Error('Expected a form control');
    }


    readonly controlType: string;
    readonly id: string;

    constructor() {
        this.controlType = inject(FORM_INPUT_CONTROL_TYPE);
        this.id = nextControlId(this.controlType);

        inject(DestroyRef).onDestroy(() => {
            this._stateSubject.complete();
        });
    }

    ngOnInit() {
        effect(() => {
            if (this.required !== this._requiredInput()) {
                this.setState({ required: this._requiredInput() })
            }

            const placeholder = this._placeholderInput()
            if (this.placeholder !== placeholder) {
                this.setState({ placeholder })
            }
        })
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

    readonly errorSubject = new BehaviorSubject<{ [K: string]: unknown } | null>(null);

    get value() {
        return this.formControl.value;
    }

    writeValue(value: TValue | null) {
        this.ngControl.valueAccessor?.writeValue(value);
    }

    registerOnChange(fn: (value: any) => void) {
        const subscription = this.ngControl.valueChanges!.subscribe(fn);
        this._subscriptions.push(subscription);
    }

    registerOnTouched(fn: () => void) {
        const subscription = this._stateSubject.pipe(
            filter(s => !!s.touched),
            distinctUntilChanged()
        ).subscribe(fn);
        this._subscriptions.push(subscription);
    }

    setDisabledState(disabled: boolean) {
        this.setState({ disabled });
    }

    getState<K extends keyof FormFieldState>(k: K): FormFieldState[K] {
        return this._stateSubject.value[k];
    }
    setState(...partials: Partial<FormFieldState>[]) {
        this._stateSubject.next(
            Object.assign({}, this._stateSubject.value, ...partials)
        );
    }
    readonly _requiredInput = input(false, { alias: 'required', transform: coerceBooleanProperty });
    get required() { return this.getState('required'); }
    readonly _placeholderInput = input<string>('', { alias: 'placeholder' });
    get placeholder() { return this.getState('placeholder'); }

    get focused() { return this.getState('focused'); }
    get empty() { return this.getState('empty'); }
    get shouldLabelFloat() { return this.getState('shouldLabelFloat'); }
    get disabled() { return this.getState('disabled'); }
    get errorState() { return this.getState('errorState'); }
    get describedByIds() { return this.getState('describedByIds'); }

    readonly valueChanges = this.ngControl.valueChanges!;
    readonly stateChanges = defer(() => combineLatest([
        this.valueChanges,
        this._stateSubject
    ]).pipe(map(() => undefined)));
}
