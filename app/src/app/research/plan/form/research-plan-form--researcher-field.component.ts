import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { UserSearchComponent } from "src/app/user/common/user-search.component";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { User } from "src/app/user/common/user";

@Component({
    selector: 'research-plan-form--researcher-field',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        UserSearchComponent,
        UserInfoComponent
    ],
    template: `
    @if (control) {
        <user-search formControlName="researcher"
              includeRoles="lab-tech"
              createTemporaryIfNotFound
              required >
            <mat-label>Primary researcher</mat-label>

            @if (errors && errors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </user-search>
    } @else {
        <div class="field-content" (dblclick)="onFieldDoubleClick()">
            <div class="field-label"><b>Primary researcher</b></div>
            <div class="field-value">
                <user-info [user]="plan!.researcher" />
            </div>
        </div>
    }
    `
})
export class ResearchPlanForm__ResearcherField extends AbstractResearchPlanDetailFieldComponent<User | null> {
    readonly controlName = 'researcher';

    onFieldDoubleClick() {
        this.contentEditableToggle.emit(true);
    }

}