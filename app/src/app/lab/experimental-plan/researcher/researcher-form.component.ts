import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { CampusSearchComponent } from "src/app/uni/campus/campus-search.component";
import { DisciplineSelectComponent } from "src/app/uni/discipline/discipline-select.component";
import { ExperimentalPlanForm, ExperimentalPlanFormErrors } from "../common/experimental-plan-form";

@Component({
    selector: 'lab-experimental-plan-researcher-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        DisciplineSelectComponent,
        CampusSearchComponent
    ],
    template: `
    <ng-container [formGroup]="form">
        <mat-form-field>
            <mat-label>Researcher</mat-label>
            <input matInput id="researcher-email" formControlName="researcher" />

            <mat-error *ngIf="researcherErrors?.required">
                A value is required
            </mat-error>
            <mat-error *ngIf="researcherErrors?.email">
                Must be a valid email address
            </mat-error>

        </mat-form-field>

        <uni-discipline-select formControlName="researcherDiscipline" required>
            <mat-label>Researcher discipline</mat-label>

            <mat-error *ngIf="disciplineErrors?.required">
                A value is required
            </mat-error>
        </uni-discipline-select>

        <uni-campus-search formControlName="researcherBaseCampus" required>
            <mat-label>Researcher base campus</mat-label>

            <mat-error *ngIf="baseCampusErrors?.required">
                A value is required
            </mat-error>
            <mat-error *ngIf="baseCampusErrors?.notACampus">
                Unrecognised campus
            </mat-error>
        </uni-campus-search>

        <mat-form-field>
            <mat-label>Supervisor</mat-label>
            <input matInput id="supervisor-email" formControlName="supervisor" />
            <mat-hint><small>Blank if academic</small></mat-hint>

            <mat-error *ngIf="supervisorErrors?.email">
                Must be a valid email
            </mat-error>
        </mat-form-field>
    </ng-container>
    `
})
export class ExperimentalPlanResearcherFormComponent {
    @Input()
    form: ExperimentalPlanForm;

    get researcherErrors(): ExperimentalPlanFormErrors['researcher'] | null {
        const nameControl = this.form.controls.researcher;
        return (nameControl.errors || null) as any;
    }

    get disciplineErrors(): ExperimentalPlanFormErrors['researcherDiscipline'] | null {
        const disciplineControl = this.form.controls.researcherDiscipline;
        return (disciplineControl.errors || null) as any;
    }

    get baseCampusErrors(): ExperimentalPlanFormErrors['researcherBaseCampus'] | null {
        const disciplineControl = this.form.controls.researcherBaseCampus;
        return (disciplineControl.errors || null) as any;
    }

    get supervisorErrors(): ExperimentalPlanFormErrors['supervisor'] {
        const supervisorControl = this.form.controls.supervisor;
        return (supervisorControl.errors || null) as any;
    }
}