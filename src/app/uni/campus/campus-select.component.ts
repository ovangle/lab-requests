import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Optional, Self, inject } from "@angular/core";
import { AbstractControl, ControlContainer, ControlValueAccessor, FormControl, FormGroup, FormGroupDirective, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { CAMPUS_CODES, Campus, CampusCode, CampusForm, campusName, createCampusForm, isCampus, isOtherCampusCode } from "./campus";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { filter, map, tap } from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";

function injectCampusForm(): CampusForm {
    const controlContainer = inject(ControlContainer, {self: true});
    const mControl = controlContainer.control;
    if (!(mControl instanceof FormGroup)) {
        throw new Error('Expected a form group for campus control');
    }
    return mControl;
}

@Component({
    selector: 'lab-req-campus-select-label',
    template: `<ng-content></ng-content>`
})
export class CampusSelectLabelComponent {}


@Component({
    selector: 'lab-req-campus-select',
    template: `
        <ng-container [formGroup]="formGroup">
            <mat-form-field>
                <mat-label><ng-content select="lab-req-campus-select-label"></ng-content></mat-label>
                <mat-select formControlName="code">
                    <mat-option *ngFor="let locationCode of campusCodes" [value]="locationCode">
                        {{_campusName(locationCode)}}
                    </mat-option>
                </mat-select>
            </mat-form-field>

            <lab-req-select-other-description
                [isOtherSelected]="isOtherCodeSelected"
                formControlName="otherDescription">
            </lab-req-select-other-description>
        </ng-container>
    `,
    styles: [`
    :host {
        display: flex;
        width: 100%;
    }
    mat-form-field {
        width: 100%;
    }
    `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: CampusSelectComponent
        }
    ]
})
export class CampusSelectComponent implements ControlValueAccessor {

    readonly campusCodes = CAMPUS_CODES;

    readonly formGroup = createCampusForm({});

    constructor() {
        this.formGroup.valueChanges.pipe(
            takeUntilDestroyed(),
            filter(() => this.formGroup.valid),
            map(value => {
                if (value?.code != null) {
                    return new Campus({
                        code: value.code,
                        otherDescription: isOtherCampusCode(value.code) ? value.otherDescription : null
                    });
                } else {
                    return null;
                }
            })
        ).subscribe((value) => {
            this._onChange(value);
            this._onTouched();
        })
    }

    readonly formChanges = this.formGroup.valueChanges.pipe(
        takeUntilDestroyed(),
        filter(() => this.formGroup.valid),
    )

    get isOtherCodeSelected(): boolean {
        return isOtherCampusCode(this.formGroup.value['code']);
    }

    _campusName(code: CampusCode) {
        return campusName(code);
    }

    writeValue(value: Campus | null) {
        if (value && !isCampus(value)) {
            throw new Error(`Invalid value for CampusSelectComponent`)
        }
        if (value) {
            this.formGroup.setValue(value);
        } else {
            this.formGroup.patchValue({code: null});
        }
    }

    _onChange = (value: any) => {};
    registerOnChange(onChange: any) {
        this._onChange = onChange;
    }
    _onTouched = () => {};
    registerOnTouched(onTouched: any) {
        this._onTouched = onTouched;
    }
    readonly setDisabledState = disabledStateToggler(this.formGroup);

}