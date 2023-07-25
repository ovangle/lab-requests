import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

export interface SoftwareResource {
    name: string;
    description: string;

    minVersion: string;
}

export type SoftwareResourceForm = FormGroup<{
    [K in keyof SoftwareResource]: FormControl<SoftwareResource[K]>
}>;

export function createSoftwareResourceForm(): SoftwareResourceForm {
    return new FormGroup({
        name: new FormControl('', { nonNullable: true, validators: [ Validators.required ] }),
        description: new FormControl('', { nonNullable: true }),
        minVersion: new FormControl('', { nonNullable: true })
    });
}

@Component({
    selector: 'lab-req-software-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ],
    template: `
        <mat-card [formGroup]="form">
            <mat-card-content>
                <mat-form-field>
                    <mat-label>Name</mat-label>
                    <input matInput
                        id="software-{{softwareIndex}}-name"
                        formControlName="name"
                        />
                </mat-form-field>

                <mat-form-field>
                    <mat-label>Description</mat-label>
                    <textarea matInput type="text"
                        id="software-{{softwareIndex}}-description"
                        formControlName="description">
                    </textarea>
                </mat-form-field>

                <mat-form-field>
                    <mat-label>Minimum version</mat-label>
                    <input matInput type="text"
                        id="software-{{softwareIndex}}-min-version"
                        formControlName="minVersion" />
                </mat-form-field>
            </mat-card-content>
        </mat-card>
    `
})
export class SoftwareResourceFormComponent {
    @Input()
    get softwareIndex(): number {
        return this._softwareIndex;
    }
    set softwareIndex(value: NumberInput) {
        this._softwareIndex = coerceNumberProperty(value);
    }
    private _softwareIndex: number;

    @Input()
    get form(): SoftwareResourceForm {
        return this._form;
    }
    set form(value: AbstractControl<any, any>) {
        if (!(value instanceof FormGroup)) {
            throw new Error('Expected a software resource form group');
        }
        this._form = value;
    }
    private _form: SoftwareResourceForm;
}