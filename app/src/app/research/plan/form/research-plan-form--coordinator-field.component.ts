import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { UserSearchComponent } from "src/app/user/user-search.component";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { User } from "src/app/user/user";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'research-plan-form--coordinator-field',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        UserSearchComponent,
        UserInfoComponent
    ],
    template: `
    @if (control) {
        <mat-form-field>
            <mat-label>Coordinator</mat-label>
            <user-search [formControl]="control"
                         [includeRoles]="['lab-tech']"
                         [discipline]="plan!.discipline"
                         required />


            <button matIconSuffix mat-icon-button
                    color="primary"
                    (click)="onSaveButtonClicked()">
                <mat-icon>save</mat-icon>
            </button>
            <button matIconSuffix mat-icon-button
                    color="warn"
                    (click)="onCancelButtonClicked()">
                <mat-icon>cancel</mat-icon>
            </button>

            @if (errors && errors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>
    } @else {
        <div class="field-content">
            <div class="field">
                <div class="field-label"><b>Coordinator</b></div>
                <div class="field-value">
                    <user-info [user]="plan!.coordinator" />
                </div>
            </div>
            <div class="controls">
                <button mat-icon-button (click)="onEditButtonClicked()"><mat-icon>edit</mat-icon></button>
            </div>
        </div>
    }
    `,
    styles: `
    .field-content {
        display: flex;
    }
    .field {
        flex-grow: 1;
    }
    `
})
export class ResearchPlanForm__CoordinatorField extends AbstractResearchPlanDetailFieldComponent<User | null> {
    readonly controlName = 'coordinator';

    onFieldDoubleClick() {
        this.contentEditableToggle.emit(true);
    }

    override get control(): FormControl<User | null> {
        return super.control as FormControl;
    }

    onEditButtonClicked() {
        this.contentEditableToggle.next(true);
    }

    onSaveButtonClicked() {
        this.contentChange.emit(this.control!.value);
        this.contentEditableToggle.emit(false);
    }
    onCancelButtonClicked() {
        this.control!.reset();
        this.contentEditableToggle.emit(false);
    }
}