import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { LAB_TYPES, LabType } from "./discipline";
import { MatFormFieldModule } from "@angular/material/form-field";


@Component({
    selector: 'lab-req-lab-type-select',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatSelectModule
    ],
    template: `
    <ng-container [formGroup]="formGroup">
        <mat-form-field>
            <mat-label><ng-content select=".label"></ng-content></mat-label>
            <mat-select formControlName="labType" multiple>
                <mat-option *ngFor="let labType of labTypes">
                    {{labType}}
                </mat-option>
            </mat-select>
        </mat-form-field>
    </ng-container>
    `
})
export class LabTypeSelectComponent<T extends {labType: FormControl<LabType[]>}> {
    readonly labTypes = LAB_TYPES;

    controlContainer = inject(ControlContainer);

    get formGroup(): FormGroup<T> {
        // Fixme
        return this.controlContainer as unknown as FormGroup<T>;
    }
}