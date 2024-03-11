
import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ControlContainer, FormGroupDirective, ReactiveFormsModule } from "@angular/forms";
import { AbstractResearchPlanDetailFieldComponent } from "../detail/abstract-research-plan-detail-field";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
  selector: 'research-plan-detail--description-field',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
  ],
  template: `
  <mat-form-field>
    <mat-label>Summary</mat-label>
    <textarea
      matInput
      id="description"
      formControlName="description"
    >
    </textarea>
  </mat-form-field>
  `,
  viewProviders: [
    {
      provide: ControlContainer,
      useExisting: FormGroupDirective
    }
  ]
})
export class ResearchPlanDetail__DescriptionField extends AbstractResearchPlanDetailFieldComponent {
  readonly name = 'description';
}

