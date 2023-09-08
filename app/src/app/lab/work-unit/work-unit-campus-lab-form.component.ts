import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { WorkUnitFormService } from "./work-unit-patch-form.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { CampusSearchModule } from "src/app/uni/campus/campus-search.module";
import { LabTypeSelectModule } from "../type/lab-type-select.module";


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

        CampusSearchModule,
        LabTypeSelectModule
    ],
    template: `
    <ng-container [formGroup]="formGroup">
        <app-uni-campus-search formControlName="campus" required>
            <app-uni-campus-search-label>
                Lab campus
            </app-uni-campus-search-label>
        </app-uni-campus-search>

        <app-lab-type-select formControlName="labType">
            <app-lab-type-select-label>Lab type</app-lab-type-select-label>
        </app-lab-type-select>

        <mat-form-field>
            <mat-label>Lab Technician</mat-label>
            <input matInput formControlName="technician">
        </mat-form-field>


        <div class="controls">
            <button mat-button 
                    (click)="workUnitFormService.commit()"
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
}