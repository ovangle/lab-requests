import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Optional, Self } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, NgControl, ReactiveFormsModule, Validators } from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

export const CAMPUS_LOCATION_CODES = ['CNS', 'BDG', 'GLD', 'MEL', 'MKY', 'PTH', 'ROK', 'SYD', 'OTH'] as const;

export type CampusLocationCode = typeof CAMPUS_LOCATION_CODES[number];
export function isOtherCampusLocationCode(code: CampusLocationCode) {
    return code === 'OTH';
}

export interface Campus {
    readonly code: CampusLocationCode;
    readonly otherDescription: string;
}

export type CampusForm = FormGroup<{ [K in keyof Campus]: FormControl<Campus[K] | null> }>;

function campusFormValidator(f: AbstractControl<any, any>): {[k: string]: any} | null {
    const g = f as CampusForm;
    if (g.controls['code'].errors != null) {
        return {'code': g.controls['code'].errors};
    }
    if (isOtherCampusLocationCode(g.controls['code'].value!)) {
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
        code: new FormControl<CampusLocationCode | null>(null, [Validators.required]),
        otherDescription: new FormControl<string | null>(null)
    }, {
        validators: campusFormValidator
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
        MatInputModule,
        MatSelectModule
    ],
    template: `
        <div [formGroup] = "formGroup">
            <mat-form-field>
                <label for="{{id}}-code">Campus</label>

                <mat-select id="{{id}}-code"
                            formControlName="code">
                    <mat-option *ngFor="let locationCode of campusLocationCodes">{{campusLocations[locationCode]}}</mat-option>
                </mat-select>
            </mat-form-field>

            <div class="other-spec-container">
                <mat-form-field *ngIf="isOtherCodeSelected">
                    <label for="{{id}}-other-description">
                        Please specify
                    </label>

                    <input matNativeControl id="{{id}}-other-description"
                            formControlName="otherDescription"
                            required />
                </mat-form-field>
            </div>
        </div>
    `
})
export class CampusSelectComponent {
    readonly campusLocationCodes = CAMPUS_LOCATION_CODES;
    readonly campusLocations = CAMPUS_LOCATIONS;

    @Input()
    id: string;

    constructor(
        @Self() @Optional() readonly ngControl: NgControl
    ) { }

    get formGroup(): CampusForm {
        const formGroup = this.ngControl.control;
        if (!(formGroup instanceof FormGroup)) {
            throw new Error('Expected a form group');
        }
        return formGroup;
    }

    get isOtherCodeSelected(): boolean {
        if (this.formGroup.controls['code']?.value == null) {
            return false;
        }
        return isOtherCampusLocationCode(this.formGroup.controls['code'].value);
    }
}