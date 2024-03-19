
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { AbstractResearchPlanDetailFieldComponent } from "./abstract-research-plan-form-field";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { TextFieldModule } from "@angular/cdk/text-field";

@Component({
  selector: 'research-plan-form--description-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextFieldModule,
    MatFormFieldModule,
    MatInputModule,

  ],
  template: `
  @if (contentEditable) {
    <mat-form-field>
      <mat-label>Summary</mat-label>
      <textarea
        matInput
        cdkTextareaAutosize
        id="description"
        formControlName="description"
      >
      </textarea>
    </mat-form-field>
  } @else {
    <div class="field-content">
      <div class="field-label">
        <b>Description</b><br/>
      </div>
      <div class="field-value">
        {{plan!.description}}
      </div>
    </div>
  }
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class ResearchPlanForm__DescriptionField extends AbstractResearchPlanDetailFieldComponent<string> {
  readonly controlName = 'description';
}

