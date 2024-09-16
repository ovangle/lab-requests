import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input, viewChild } from "@angular/core";
import { AbstractControlDirective, FormControl, NgControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatSelect, MatSelectModule } from "@angular/material/select";
import { LabStorage, LabStorageService } from "./lab-storage";
import { BehaviorSubject, combineLatest, map, Observable } from "rxjs";
import { coerceBooleanProperty } from "@angular/cdk/coercion";
import { toObservable } from "@angular/core/rxjs-interop";

let _currentId: number = 0;
function _nextControlId() {
    return _currentId++;
}

@Component({
    selector: 'lab-storage-strategy-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule
    ],
    template: `
    <mat-select [formControl]="formControl"
                [required]="required">
        @if (allStorageStrategies$ | async; as storageStrategies) {
            @for (strategy of storageStrategies; track strategy.id) {
                <mat-option [value]="strategy">
                    {{strategy.name}}
                </mat-option>
            }
        }
    </mat-select>

    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LabStorageStrategySelect implements MatFormFieldControl<LabStorage> {
    readonly _labStorageService = inject(LabStorageService);
    readonly allStorageStrategies$ = this._labStorageService.allStrategies();

    readonly _required = input(false, {alias: 'required', transform: coerceBooleanProperty});
    get required() { return this._required(); }

    _matSelect = viewChild.required(MatSelect);

    readonly controlType = 'lab-storage-strategy-select';
    readonly id: string;
    readonly ngControl = inject(NgControl, {self: true});
    readonly placeholder = '';
    readonly shouldLabelFloat = true;

    get formControl(): FormControl<LabStorage> {
        if (this.ngControl.control instanceof FormControl) {
            return this.ngControl.control;
        }
        throw new Error(`lab-storage-strategy-select must be bound to a formControl`);
    }

    get value() {
        return this.ngControl.value;
    }

    constructor() {
        this.id = `${this.controlType}-${_nextControlId()}`;
    }

    get focused() { return this._matSelect().focused; }
    get empty() { return this.value == null; }
    get disabled() { return this.ngControl.disabled!; }
    get errorState() { return !this.formControl.valid; }
    disableAutomaticLabeling?: boolean | undefined;

    _describedByIdsSubject = new BehaviorSubject<string[]>([]);
    setDescribedByIds(ids: string[]): void {
        this._describedByIdsSubject.next(ids);
    }

    onContainerClick(event: MouseEvent): void {
        this._matSelect().onContainerClick();
    }
    readonly stateChanges = combineLatest([
        this.formControl.valueChanges,
        this.formControl.statusChanges,
        toObservable(this._required),
        this._describedByIdsSubject
    ]).pipe(map(() => undefined));
}