import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Optional, Self } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormGroupDirective, NgControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

export const CAMPUS_CODES = ['CNS', 'BDG', 'GLD', 'MEL', 'MKY', 'PTH', 'ROK', 'SYD', 'OTH'] as const;

export type CampusCode = typeof CAMPUS_CODES[number];
export function isOtherCampusCode(code: CampusCode | null | undefined) {
    return code === 'OTH';
}

export interface Campus {
    readonly code: CampusCode;
    readonly otherDescription: string;
}

export type CampusForm = FormGroup<{ [K in keyof Campus]: FormControl<Campus[K] | null> }>;

export function campusFormValidator(f: AbstractControl<any, any>): {[k: string]: any} | null {
    const g = f as CampusForm;
    if (g.controls['code'].errors != null) {
        return {'code': g.controls['code'].errors};
    }
    if (isOtherCampusCode(g.controls['code'].value!)) {
        if (g.controls['otherDescription'].value == null) {
            return {
                'otherDescriptionRequired': 'A description is required'
            };
        }
    }
    return null;
}

export function createCampusForm(): CampusForm {
    return new FormGroup({
        code: new FormControl<CampusCode | null>(null, [Validators.required]),
        otherDescription: new FormControl<string | null>(null)
    }, {
        validators: [Validators.required, campusFormValidator]
    })
}


export const CAMPUS_LOCATIONS = Object.fromEntries([
    ['CNS', 'Cairns'],
    ['BDG', 'Bundaberg'],
    ['GLD', 'Gold Coast'],
    ['MEL', 'Melbourne'],
    ['MKY', 'Mackay'],
    ['PTH', 'Perth'],
    ['ROK', 'Rockhampton'],
    ['SYD', 'Sydney'],
    ['OTH', 'Other...']
]);

@Component({
    selector: 'lab-req-campus-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    template: `
        <div [formGroup]="form">
            <mat-form-field>
                <mat-label>Campus</mat-label>
                <mat-select id="{{id}}-code" formControlName="code">
                    <mat-option *ngFor="let locationCode of campusCodes" [value]="locationCode">{{campuses[locationCode]}}</mat-option>
                </mat-select>
            </mat-form-field>

            <div class="other-spec-container">
                <mat-form-field *ngIf="isOtherCodeSelected">
                    <mat-label>Please specify</mat-label>
                    <input matInput required
                           id="{{id}}-other-description"
                           formControlName="otherDescription">
                </mat-form-field>
            </div>
        </div>
    `
})
export class CampusSelectComponent {
    readonly campusCodes = CAMPUS_CODES;
    readonly campuses = CAMPUS_LOCATIONS;

    @Input()
    id: string;

    @Input()
    get form(): CampusForm {
        return this._form;
    }
    set form(value: AbstractControl<any, any>) {
        if (!(value instanceof FormGroup)) {
            throw new Error('Expected campus form group')
        }
        this._form = value;
    }

    private _form: CampusForm;

    get isOtherCodeSelected(): boolean {
        return isOtherCampusCode(this.form.value['code']);
    }
}