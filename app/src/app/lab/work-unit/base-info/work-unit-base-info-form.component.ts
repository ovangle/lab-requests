import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { CampusSearchModule } from "src/app/uni/campus/campus-search.module";
import { LabTypeSelectModule } from "../../type/lab-type-select.module";
import { WorkUnitForm, WorkUnitFormService } from "../work-unit-form.service";
import { WorkUnit, WorkUnitPatch } from "../work-unit";

@Component({
    selector: 'lab-work-unit-base-info-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        CampusSearchModule,
        LabTypeSelectModule
    ], 
    template: `
    <form [formGroup]="form">
        <uni-campus-search formControlName="campus" required> 
            <mat-label>Lab Campus</mat-label>
        <uni-campus-search>

        <app-lab-type-select formControlName="labType">
            <app-lab-type-select-label>Lab type</app-lab-type-select-label>
        </app-lab-type-select>

        <mat-form-field>
            <mat-label>Lab Technician</mat-label>
            <input matInput formControlName="technicianEmail">
        </mat-form-field>

        <mat-form-field>
            <mat-label>Process summary</mat-label>
            <textarea matInput formControlName="summary">
            </textarea>
        </mat-form-field>
 
        <div class="controls">
            <button mat-button 
                    (click)="_formService.commit()"
                    [disabled]="!form.valid">
                <mat-icon>keyboard_left</mat-icon>
                Next
            </button>
        </div>
    </form>
    `,
    styles: [`
    :host {
        display: flex;
        flex-direction: column;
    }

    .controls {
        display: flex;
        justify-content: flex-end;
    }
    `],
    providers: [
        WorkUnitFormService
    ]
})
export class WorkUnitBaseInfoFormComponent {
    readonly _controls = [
        'campus',
        'labType', 
        'technicianEmail',
        'summary'
    ] as const;

    @Input()
    committed: WorkUnit | null;

    @Input()
    form: WorkUnitForm;

    @Output()
    requestCommit = new EventEmitter<WorkUnitPatch>();

    reset() {
        this.form.reset();
        if (this.committed != null) {
            this.form.patchValue(this.committed);
        }
    }
}