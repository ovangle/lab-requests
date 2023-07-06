import { Component, Input } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

export interface SoftwareResource {
    name: string;
    description: string;

    minVersion: string;
}

export type SoftwareResourceFormGroup = FormGroup<{
    [K in keyof SoftwareResource]: FormControl<SoftwareResource[K]>
}>;

export function createSoftwareResourceFormGroup(): SoftwareResourceFormGroup {
    return new FormGroup({
        name: new FormControl('', {nonNullable: true}),
        description: new FormControl('', {nonNullable: true}),
        minVersion: new FormControl('', {nonNullable: true})
    });
}

@Component({
    selector: 'lab-software-resource-form',
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
        <div>
            <mat-form-field>
                <label for="software-{{index}}-name">
                    Name
                </label>
                <input matNativeControl type="text"
                       id="software-{{index}}-name" 
                       formControlName="name" />
            </mat-form-field>

            <mat-form-field>
                <label for="software-{{index}}-description">
                    Description
                </label>
                <input matNativeControl type="text" multiline
                       id="software-{{index}}-description"
                       formControlName="description" />
            </mat-form-field>

            <mat-form-field>
                <label for="software-{{index}}-min-version">
                    Minimum version
                </label>
                <input matNativeControl type="text"
                       id="software-{{index}}-min-version"
                       formControlName="minVersion" />
            </mat-form-field>
       </div>
    `
})
export class SoftwareResourceFormComponent {
    @Input()
    index: number = 0;

    @Input()
    form: FormGroup;
}