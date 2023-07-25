import { Component, Input, numberAttribute } from "@angular/core";
import { NumberInput, coerceNumberProperty } from "@angular/cdk/coercion";
import { MatCardModule } from "@angular/material/card";
import { MatSelectModule } from "@angular/material/select";
import { Campus, CampusForm, CampusCode, CampusSelectComponent, createCampusForm } from "./campus-select.component";
import { AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { ThisReceiver } from "@angular/compiler";
import { RoomAllocation, RoomAllocationForm, RoomAllocationFormComponent, createRoomAllocationForm } from "./room-allocation-form.component";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";


export interface ProjectLocation {
    isPrimaryLocation: boolean;
    campus: Campus;

    rooms: RoomAllocation[];
}

export type ProjectLocationForm = FormGroup<{
    [K in keyof ProjectLocation]:
    ProjectLocation[K] extends Campus ? CampusForm
    : ProjectLocation[K] extends Array<any> ? FormArray<any>
    : FormControl<ProjectLocation[K]>
}>;


export function createProjectLocationForm(isPrimaryLocation: boolean): ProjectLocationForm {
    return new FormGroup({
        campus: createCampusForm(),

        rooms: new FormArray<RoomAllocationForm>([
            createRoomAllocationForm()
        ]),

        // hidden controls
        isPrimaryLocation: new FormControl(isPrimaryLocation, { nonNullable: true }),
    })
}

@Component({
    selector: 'lab-req-project-location-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,

        CampusSelectComponent,
        RoomAllocationFormComponent
    ],
    template: `
        <style>
            .project-location-form {
                display: flex;
                flex-direction: column;
            }

            h4.room-allocation-header > button {
                float: right;
            }
        </style>

        <mat-card [formGroup]="form" class="project-location-form">
            <mat-card-title>
                {{isPrimaryLocation ? 'Primary' : 'Secondary'}} research campus
            </mat-card-title>

            <mat-card-content>
                <lab-req-campus-select id="location-{{locationIndex}}-campus"
                                    [form]="form.controls['campus']">
                </lab-req-campus-select>

                <h4 class="room-allocation-header">
                    Room allocations
                    <button mat-button (click)="addAdditionalRoomAllocation()">+ Add</button>
                </h4>

                <lab-req-room-allocation-form
                    *ngFor="let roomAllocation of form.controls['rooms'].controls; let roomIndex = index"
                    [form]="roomAllocation"
                    [locationIndex]="locationIndex"
                    [roomIndex]="roomIndex">
                </lab-req-room-allocation-form>
            </mat-card-content>
        </mat-card>
    `
})
export class ProjectLocationFormComponent {
    @Input()
    get form(): ProjectLocationForm {
        return this._form;
    }
    set form(value: AbstractControl<any, any>) {
        if (!(value instanceof FormGroup)) {
            throw new Error('Expected a form group')
        }
        this._form = value;
    }
    private _form: ProjectLocationForm;

    @Input()
    get locationIndex() {
        return this._locationIndex;
    }
    set locationIndex(value: NumberInput) {
        this._locationIndex = coerceNumberProperty(value);
    }
    private _locationIndex: number;

    get isPrimaryLocation(): boolean {
        return !!this.form.value.isPrimaryLocation
    }

    roomAllocationForm(control: AbstractControl<any, any>): RoomAllocationForm {
        console.log(control);
        return control as RoomAllocationForm;
    }

    addAdditionalRoomAllocation() {
        this.form.controls['rooms'].push(createRoomAllocationForm());
    }
}
