import { CommonModule } from "@angular/common"
import { Component, Input } from "@angular/core"
import { Form, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms"
import { ResearchPlan } from "../research-plan"
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ResearchPlanTask, CreateResearchPlanTask } from "./research-plan-task";
import { Lab } from "src/app/lab/lab";
import { User } from "src/app/user/common/user";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { BooleanInput, NumberInput, coerceBooleanProperty, coerceNumberProperty } from "@angular/cdk/coercion";
import { UserSearchComponent } from "src/app/user/common/user-search.component";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { ResizeTextareaOnInputDirective } from "src/app/common/forms/resize-textarea-on-input.directive";


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
      { nonNullable: true, validators: [ Validators.required ] }
    ),
    startDate: new FormControl<Date | null>(task?.startDate || null),
    endDate: new FormControl<Date | null>(task?.endDate || null),

    lab: new FormControl<Lab | null>(null),
    supervisor: new FormControl<User | null>(null)
  })
}

export function createResearchPlanTaskFromForm(form: ResearchPlanTaskForm): CreateResearchPlanTask {
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
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,

    ResizeTextareaOnInputDirective,
    LabSearchComponent,
    UserSearchComponent

  ],
  template: `
    <div class="index">
      {{index + 1}}.
    </div>

    <div class="controls" [formGroup]="form!">
      <mat-form-field class="description-field">
        <mat-label>Description</mat-label>
        <textarea matInput resizeOnInput
                  formControlName="description" required> 
        </textarea>
        @if (descriptionErrors && descriptionErrors['required']) {
          <mat-error>A description is required</mat-error>
        }
      </mat-form-field>

      <div>
      <mat-form-field class="duration-field">
          <mat-label>Duration</mat-label>
          <mat-date-range-input [rangePicker]="durationPicker">
            <input matStartDate formControlName="startDate" placeholder="start" />
            <input matEndDate formControlName="endDate" placeholder="end" />
          </mat-date-range-input>

          <mat-hint>DD/MM/YYYY - DD/MM/YYYY</mat-hint>

          <mat-datepicker-toggle matIconSuffix [for]="durationPicker" />
          <mat-date-range-picker #durationPicker />
      </mat-form-field>
      </div>

      @if (!hideReviewControls) {
        <lab-search formControlName="lab">
          <mat-label>Lab</mat-label>
        </lab-search>

        <user-search formControlName="technician" 
                     [includeRoles]="technicianRoles">
          <mat-label>Technician</mat-label>
        </user-search>
      }
    <div>
  `,
  styles: `
  :host {
    margin-top: var(--mat-form-field-subscript-text-line-height);
    margin-right: 1em;
    display: flex;
  }

  .controls {
    display: flex; 
    flex-grow: 1;
  }
  .duration-field {
    padding-left: 1em;
    box-sizing: border-box;
  }
  .description-field {
    flex-grow: 1;
  }

  /*
  :host mat-form-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
    max-height: 0;
    overflow: hidden;
  }
  */

  .index {
    min-width: 3em;
    display: flex;
    justify-content: center;
    // align-items: center;
  }
  `
})
export class ResearchPlanTaskFormComponent {
  @Input({ required: true })
  form: ResearchPlanTaskForm | undefined;

  @Input({ required: true })
  get index(): number {
    return this._index;
  }
  set index(value: NumberInput) {
    this._index = coerceNumberProperty(value);
  }
  _index: number = 0;

  @Input()
  get hideReviewControls() {
    return this._hideReviewControls;
  }
  set hideReviewControls(value: BooleanInput) {
    this._hideReviewControls = coerceBooleanProperty(value);
  }
  _hideReviewControls: boolean = false;

  get descriptionErrors(): ValidationErrors | null {
    return this.form!.controls.description.errors;
  }

  get technicianRoles() {
    const roles = new Set([ 'lab-tech' ]);
    const lab = this.form?.value.lab;

    if (lab) {
      roles.add(`lab-tech-${lab.discipline}`)
    }
    return roles;
  }
}