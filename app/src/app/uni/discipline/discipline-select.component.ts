import { CommonModule, formatNumber } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { ControlContainer, ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { DISCLIPLINES, Discipline } from "./discipline";
import { MatFormFieldModule } from "@angular/material/form-field";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";

@Component({
    selector: 'uni-discipline-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="mat-label"></ng-content>
        </mat-label>
        <mat-select [formControl]="_control" (closed)="_onTouched()">
            <mat-option *ngFor="let discipline of disciplines" [value]="discipline">
                {{discipline}}
            </mat-option>
        </mat-select>

        <mat-error>
            <ng-content select="mat-error"></ng-content>
        </mat-error>
    </mat-form-field>
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: DisciplineSelectComponent
        }
    ],
    styles: [`
        mat-form-field { width: 100%; }
    `]
})
export class DisciplineSelectComponent implements ControlValueAccessor {
    readonly disciplines = DISCLIPLINES;

    readonly _control = new FormControl<Discipline | null>(null);

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
    _onChange = (value: Discipline | null) => {};
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => {};
    registerOnTouched(fn: any) {
        this._onTouched = fn;
    }

    readonly setDisabledState = disabledStateToggler(this._control);
}
