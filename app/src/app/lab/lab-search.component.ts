import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ControlValueAccessor, FormControl } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatFormFieldModule } from "@angular/material/form-field";
import { firstValueFrom } from "rxjs";
import { Lab, injectLabService } from "./lab";
import { disabledStateToggler } from "../utils/forms/disable-state-toggler";

@Component({
    selector: 'lab-search',
    standalone: true,
    imports: [
        CommonModule,
        MatAutocompleteModule,
        MatFormFieldModule,
    ],
    template: `
    <mat-form-field>
        <mat-label>
            <ng-content select="mat-label"></ng-content>

            <
        </mat-label>
    </mat-form-field>
    `
})
export class LabSearchComponent implements ControlValueAccessor {
    readonly labs = injectLabService();
    readonly _control = new FormControl<Lab | string | null>(null);


    writeValue(obj: string | null): void {
        if (typeof obj === 'string') {
            firstValueFrom(this.labs.fetch(obj)).then(lab => {
                this._control.setValue(lab);
            });
        } else {
            this._control.setValue(null);
        }
    }
    _onChange = (value: Lab | null) => { };
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    _onTouched = () => { };
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    readonly setDisabledState = disabledStateToggler(this._control);
}