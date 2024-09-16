import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { UserSearchComponent } from "src/app/user/user-search.component";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { User } from "src/app/user/user";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'research-plan-form--researcher-field',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        UserSearchComponent,
        UserInfoComponent
    ],
    template: `
    @if (contentEditable) {
        <mat-form-field>
            <mat-label>Primary researcher</mat-label>
            <user-search [formControl]="control!"
                         [includeRoles]="['lab-tech']"
                         clearOnFocus
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
        <div class="field-content" (dblclick)="onFieldDoubleClick()">
            <div class="field">
                <div class="field-label"><b>Primary researcher</b></div>
                <div class="field-value">
                    <user-info [user]="plan!.researcher" />
                </div>
            </div>
            <div class="controls">
                <button mat-icon-button (click)="onEditButtonClick()"><mat-icon>edit</mat-icon></button>
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
export class ResearchPlanForm__ResearcherField extends AbstractResearchPlanDetailFieldComponent<User | null> {
    readonly controlName = 'researcher';

    onFieldDoubleClick() {
        this.contentEditableToggle.emit(true);
    }

    onEditButtonClick() {
        this.contentEditableToggle.emit(true);
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