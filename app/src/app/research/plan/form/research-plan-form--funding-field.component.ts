import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { ResearchFunding } from "../../funding/research-funding";
import { ResearchFundingSelectComponent } from "../../funding/research-funding-select.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { P } from "@angular/cdk/keycodes";
import { ResearchFundingInfoComponent } from "../../funding/research-funding-info.component";

@Component({
    selector: 'research-plan-form--funding-field',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,

        ResearchFundingInfoComponent,
        ResearchFundingSelectComponent
    ],
    template: `
    @if (contentEditable) {
      <research-funding-select [formControl]="control!" required>
        <mat-label>Funding source</mat-label>

        <button mat-icon-button matIconSuffix color="primary"
            (click)="onSaveButtonClicked()">
            <mat-icon>save</mat-icon>
        </button>
        <button mat-icon-button matIconSuffix color="warn"
            (click)="onCancelButtonClicked()">
            <mat-icon>cancel</mat-icon>
        </button>

        @if (errors && errors['required']) {
          <mat-error>A value is required</mat-error>
        }
        @if (errors && errors['notAFundingModel']) {
          <mat-error>Unrecognised funding source</mat-error>
        }
      </research-funding-select>
    } @else {
        <div class="field-content">
            <div class="field">
                <div class="field-label"><b>Funding</b></div>
                <research-funding-info [funding]="plan!.funding" />
            </div>
            <div class="controls">
                <button mat-icon-button (click)="onEditButtonClicked()">
                    <mat-icon>edit</mat-icon>
                </button>
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
export class ResearchPlanForm__FundingField extends AbstractResearchPlanDetailFieldComponent<ResearchFunding> {
    override readonly controlName = "funding";

    onEditButtonClicked() {
        this.contentEditableToggle.emit(true);
    }

    onSaveButtonClicked() {
        this.contentChange.emit(this.control!.value)
        this.contentEditableToggle.emit(false);
    }

    onCancelButtonClicked() {
        this.control!.reset();
        this.contentEditableToggle.emit(true);
    }
}