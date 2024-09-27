import { Component, inject, input } from "@angular/core";
import { Software } from "./software";
import { AbstractModelForm, ModelFormActionsComponent } from "../common/model/forms/abstract-model-form.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { SoftwareNameUniqueValidator } from "./software-name-unique-validator.directive";

export function softwareFormGroupFactory() {
    const fb = inject(FormBuilder);

    return () => new FormGroup({
        name: new FormControl<string>('', {
            nonNullable: true
        })
    });
}

export type SoftwareFormGroup = ReturnType<ReturnType<typeof softwareFormGroupFactory>>;

@Component({
    selector: 'software-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        ModelFormActionsComponent,
        SoftwareNameUniqueValidator
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>

            <input matInput type="text"
                  formControlName="name"
                  validateSoftwareNameUnique
                  required
                  />

            @let nameControl = form.controls.name;

            @if (nameControl.errors && nameControl.errors['required']) {
                <mat-error>A value is required</mat-error>
            }

            @if (nameControl.errors && nameControl.errors['unique']) {
                <mat-error>Name must be unique</mat-error>
            }

        </mat-form-field>

        <model-form-actions />
    </form>
    `,
    providers: [
        { provide: AbstractModelForm, useExisting: SoftwareFormComponent }
    ]
})
export class SoftwareFormComponent extends AbstractModelForm<SoftwareFormGroup> {
    override readonly _createStandaloneForm = softwareFormGroupFactory()

    software = input<Software | null>();

}