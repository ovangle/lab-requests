import { Component, Input } from "@angular/core";
import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { MatSelectModule } from "@angular/material/select";
import { Campus, CampusForm, CampusSelectComponent, createCampusForm } from "./campus-select.component";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";

export interface ProjectLocation {
    isPrimaryLocation: boolean;
    campus: Campus;
    room: string;
}

export type ProjectLocationForm = FormGroup<{
    [K in keyof ProjectLocation]:
        ProjectLocation[K] extends Campus ? CampusForm : FormControl<ProjectLocation[K]>
}>;

export function createProjectLocationForm(isPrimaryLocation: boolean): ProjectLocationForm {
    return new FormGroup({
        campus: createCampusForm(),
        room: new FormControl('', {
            validators: [Validators.required],
            nonNullable: true
        }),

        // hidden controls
        isPrimaryLocation: new FormControl(isPrimaryLocation, {nonNullable: true}),
    })
}

@Component({
    selector: 'lab-req-project-location',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,

        CampusSelectComponent
    ],
    template: `
        <div [formGroup]="formGroup">
            <lab-req-campus-select id="location-{{index}}-campus"
                                   formGroupName="campus">
            </lab-req-campus-select>

            <mat-form-field>
                <mat-label>
                    Room number
                </mat-label>

                <input matInput type="text"
                       id="location-{{index}}-room"
                       formControlName="room" />
            </mat-form-field>
        </div>
    `
})
export class ProjectLocationFormComponent {
    @Input() formGroup: FormGroup;

    @Input()
    get index() {
        return this._index;
    }
    set index(value: NumberInput) {
        this._index = coerceNumberProperty(value);
    }
    private _index: number;
}
