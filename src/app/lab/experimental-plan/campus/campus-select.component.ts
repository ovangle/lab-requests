import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Optional, Self } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, FormGroupDirective, NgControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { CAMPUS_CODES, CampusCode, CampusForm, campusName, isOtherCampusCode } from "./campus";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";

@Component({
    selector: 'lab-req-campus-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        SelectOtherDescriptionComponent
    ],
    template: `
        <div [formGroup]="form">
            <mat-form-field>
                <mat-label>Campus</mat-label>
                <mat-select id="{{id}}-code" formControlName="code">
                    <mat-option *ngFor="let locationCode of campusCodes" [value]="locationCode">
                        {{_campusName(locationCode)}}
                    </mat-option>
                </mat-select>
            </mat-form-field>

            <lab-req-select-other-description
                [isOtherSelected]="isOtherCodeSelected"
                formControlName="otherDescription">
            </lab-req-select-other-description>
        </div>
    `,
    styles: [`
    mat-form-field {
        width: 100%;
    }
    `]
})
export class CampusSelectComponent {
    readonly campusCodes = CAMPUS_CODES;

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

    _campusName(code: CampusCode) {
        return campusName(code);
    }
}