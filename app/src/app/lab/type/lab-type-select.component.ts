import { Component, Input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormControl } from "@angular/forms";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";
import { LabType, labTypes } from "./lab-type";


@Component({
    selector: 'app-lab-type-select-label',
    template: `<ng-content></ng-content>`
})
export class LabTypeSelectLabelComponent {

}

@Component({
    selector: 'app-lab-type-select-option',
    template: `
        {{labType}}
    `
})
export class LabTypeSelectOptionComponent {
    @Input()
    labType: LabType;
}

@Component({
    selector: 'app-lab-type-select',
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="lab-req-discipline-select-label"></ng-content>
        </mat-label>
        <mat-select [formControl]="_control" (closed)="_onTouched()">
            <mat-option *ngFor="let labType of labTypes" [value]="labType">
                <app-lab-type-select-option [labType]="labType"></app-lab-type-select-option>
            </mat-option>
        </mat-select>
    </mat-form-field>
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: LabTypeSelectComponent
        }
    ],
    styles: [`
    mat-form-field { width: 100%; }
    `]
})
export class LabTypeSelectComponent implements ControlValueAccessor {
    readonly labTypes = labTypes;

    readonly _control = new FormControl<LabType | null>(null);

    constructor() {
        this._control.valueChanges.pipe(
            takeUntilDestroyed()
        ).subscribe(value => {
            this._onChange(value);
        })
    }

    writeValue(value: any) {
        this._control.setValue(value);
    }
    _onChange = (value: LabType | null) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any) {
        this._onTouched = fn;
    }

    readonly setDisabledState = disabledStateToggler(this._control);
}