import { ChangeDetectionStrategy, Component, inject, input, viewChild } from "@angular/core";
import { LabDisposalService, LabDisposalStrategy } from "./lab-disposal";
import { CommonModule } from "@angular/common";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { MatFormFieldControl } from "@angular/material/form-field";
import { NgControl, AbstractControlDirective, FormControl, ReactiveFormsModule } from "@angular/forms";
import { BehaviorSubject, combineLatest, map, mapTo, Observable } from "rxjs";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { toObservable } from "@angular/core/rxjs-interop";

let _currentInputId: number = 0;
function _nextInputId() {
    return _currentInputId++;
}

@Component({
    selector: 'lab-disposal-strategy-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule,
    ],
    template: `
    <mat-select [formControl]="formControl"
        (focus)="_onFocus()"
        (blur)="_onBlur()">
        @if (allStrategies$ | async; as allStrategies) {
            @for (strategy of allStrategies; track strategy.id) {
                <mat-option [value]="strategy">{{strategy.name}}</mat-option>
            }
        }
    </mat-select>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabDisposalStrategySelect implements MatFormFieldControl<LabDisposalStrategy> {
    readonly _labDisposalService = inject(LabDisposalService);
    readonly allStrategies$ = this._labDisposalService.allStrategies();

    readonly ngControl = inject(AbstractControlDirective, {self: true});
    readonly _matSelect = viewChild.required(MatSelect);

    get formControl(): FormControl<any> {
        if (!(this.ngControl.control instanceof FormControl)) {
            throw new Error('lab-disposal-strategy-select must be bound to a formControl')
        }
        return this.ngControl.control;
    }

    readonly _required = input(false, {transform: coerceBooleanProperty, alias: 'required'})
    get required() {
        return this._required();
    }

    readonly controlType = 'lab-disposal-strategy-select';
    readonly id: string;

    constructor() {
        this.id = `${this.controlType}${_nextInputId()}`;
    }

    get value() {
        return this.ngControl.value;
    }
    get disabled() {
        return this.formControl.disabled;
    }

    placeholder = '';

    readonly _focusSubject = new BehaviorSubject(false);
    get focused() {
        return this._focusSubject.value;
    }

    get empty() {
        return this.value == null;
    }
    get errorState() {
        return !this.formControl.valid;
    }

    shouldLabelFloat = true;
    autofilled = false;

    readonly _describedByIdSubject = new BehaviorSubject<string[]>([]);
    setDescribedByIds(ids: string[]): void {
        this._describedByIdSubject.next(ids);
    }

    onContainerClick(event: MouseEvent): void {
        this._matSelect().onContainerClick();
    }

    _onFocus() {
        this._focusSubject.next(true);
    }
    _onBlur() {
        this._focusSubject.next(false);


    }

    readonly stateChanges = combineLatest([
        this.formControl.statusChanges,
        this.formControl.valueChanges,
        this._focusSubject,
        toObservable(this._required),
        this._describedByIdSubject
    ]).pipe(map(() => undefined));

}