
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TextFieldModule } from "@angular/cdk/text-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'research-plan-form--description-field',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,

  ],
  template: `
  @if (contentEditable) {
    <div class="field-content">
      <mat-form-field>
        <mat-label>Summary</mat-label>
        <textarea
          matInput
          cdkTextareaAutosize
          id="description"
          [formControl]="control!"
        >
        </textarea>
        <button matIconSuffix mat-icon-button color="primary" (click)="onSaveButtonClicked()">
          <mat-icon>save</mat-icon>
        </button>
        <button matIconSuffix mat-icon-button color="warn" (click)="onCancelButtonClicked()">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-form-field>
    </div>
  } @else {
    <div class="field-content">
      <div class="field">
        <div class="field-label">
          <b>Summary</b><br/>
        </div>
        <div class="field-value">
          {{plan!.description}}
        </div>
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
  .field-content > .field {
    flex-grow: 1;
  }
  `,
})
export class ResearchPlanForm__DescriptionField extends AbstractResearchPlanDetailFieldComponent<string> {
  readonly controlName = 'description';

  onEditButtonClicked() {
    this.contentEditableToggle.emit(true);
  }

  onSaveButtonClicked() {
    this.contentChange.next(this.control!.value);
    this.contentEditableToggle.next(false);
  }

  onCancelButtonClicked() {
    this.contentEditableToggle.next(false);
  }
}

