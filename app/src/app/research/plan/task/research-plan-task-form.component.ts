import { CommonModule } from "@angular/common"
import { Component, Input } from "@angular/core"
import { Form, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms"
import { ResearchPlan } from "../common/research-plan"
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ResearchPlanTask, ResearchPlanTaskPatch } from "./research-plan-task";
import { Lab } from "src/app/lab/lab";
import { User } from "src/app/user/common/user";


export type ResearchPlanTaskForm = FormGroup<{
  description: FormControl<string>;
  startDate: FormControl<Date | null>;
  endDate: FormControl<Date | null>;
  lab: FormControl<Lab | null>;
  supervisor: FormControl<User | null>;
}>;

export function researchPlanTaskForm(task?: ResearchPlanTask): ResearchPlanTaskForm {
  return new FormGroup({
    description: new FormControl(
      task?.description || '',
      { nonNullable: true, validators: [Validators.required] }
    ),
    startDate: new FormControl<Date | null>(task?.startDate || null),
    endDate: new FormControl<Date | null>(task?.endDate || null),

    lab: new FormControl<Lab | null>(null),
    supervisor: new FormControl<User | null>(null)
  })
}

export function researchPlanTaskPatchFromForm(form: ResearchPlanTaskForm): ResearchPlanTaskPatch {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }

  return {
    description: form.value.description!,
    startDate: form.value.startDate || null,
    endDate: form.value.endDate || null,
    labId: form.value.lab?.id || null,
    supervisorId: form.value.supervisor?.id || null
  };
}


@Component({
  selector: 'research-plan-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="index">
      {{index + 1}}.
    </div>

    <div class="controls" [formGroup]="form!">
      <mat-form-field>
        <mat-label>Description</mat-label>
        <input matInput type="text" formControlName="description" required/> 
        @if (descriptionErrors && descriptionErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

    <div>
  `,
  styles: `
  :host {
    display: flex;
  }
  `
})
export class ResearchPlanTaskFormComponent {
  @Input({ required: true })
  form: ResearchPlanTaskForm | undefined;

  @Input({ required: true })
  index: number = 0;

  get descriptionErrors(): ValidationErrors | null {
    return this.form!.controls.description.errors;
  }
}