import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { WorkUnitFormService } from "./work-unit-form.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { CampusModule } from "../../../uni/campus/campus.module";
import { DisciplineSelectModule } from "../../../uni/discipline/discipline-select.module";


/**
 * The first step in creating a new work unit is to set the
 *  - campus;
 *  - discipline; and
 *  - supervisor
 *
 * which represent where the work unit will take place and the
 *
 */
@Component({
    selector: 'lab-req-work-unit-campus-lab-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,

        CampusModule,
        DisciplineSelectModule
    ],
    template: `
    <ng-container [formGroup]="formGroup">
        <lab-req-campus-select formControlName="campus">
            <lab-req-campus-select-label>Campus</lab-req-campus-select-label>
        </lab-req-campus-select>

        <lab-req-discipline-select formControlName="labType">
            <lab-req-discipline-select-label>Lab type</lab-req-discipline-select-label>
        </lab-req-discipline-select>

        <mat-form-field>
            <mat-label>Lab Technician</mat-label>
            <input matInput formControlName="technician">
        </mat-form-field>



        <div class="controls">
            <button mat-button (click)="commit()"
                    [disabled]="!formGroup.valid">
                <mat-icon>keyboard_left</mat-icon>
                Next
            </button>
        </div>
    </ng-container>
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
    `]
})
export class WorkUnitCampusLabFormComponent {
    workUnitFormService = inject(WorkUnitFormService);

    get formGroup(): FormGroup<any> {
        return this.workUnitFormService.form;
    }

    commit() {
        this.workUnitFormService.commitChanges();
    }
}