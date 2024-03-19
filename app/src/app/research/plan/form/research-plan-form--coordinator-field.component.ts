import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { UserSearchComponent } from "src/app/user/common/user-search.component";
import { UserInfoComponent } from "src/app/user/user-info.component";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { User } from "src/app/user/common/user";

@Component({
    selector: 'research-plan-form--coordinator-field',
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
        <user-search [formControl]="control"
              includeRoles="lab-tech"
              [discipline]="plan!.discipline"
              createTemporaryIfNotFound
              required >
            <mat-label>Coordinator</mat-label>

            @if (errors && errors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </user-search>
    } @else {
        <div class="field-content" (dblclick)="onFieldDoubleClick()">
            <div class="field-label"><b>Coordinator</b></div>
            <div class="field-value">
                <user-info [user]="plan!.researcher" />
            </div>
        </div>
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

}