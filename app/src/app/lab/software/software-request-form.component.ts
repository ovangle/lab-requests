import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { newSoftwareRequestForm } from "./software";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";


@Component({
    selector: 'lab-software-request-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name"/>
        </mat-form-field>
    </form>
    `
})
export class LabSoftwareRequestFormComponent {
    readonly form = newSoftwareRequestForm();
}