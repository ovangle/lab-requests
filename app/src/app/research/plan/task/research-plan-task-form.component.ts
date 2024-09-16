import { CommonModule } from "@angular/common"
import { Component, Input } from "@angular/core"
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms"

import { BooleanInput, NumberInput, coerceBooleanProperty, coerceNumberProperty } from "@angular/cdk/coercion";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CreateResearchPlanTask, ResearchPlanTask, ResearchPlanTaskSlice } from "./research-plan-task";
import { Lab } from "src/app/lab/lab";
import { User } from "src/app/user/user";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { UserSearchComponent } from "src/app/user/user-search.component";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { TextFieldModule } from "@angular/cdk/text-field";


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

export function createResearchPlanTaskFromForm(form: ResearchPlanTaskForm): CreateResearchPlanTask {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }

  return {
    lab: form.value.lab!.id,
    supervisor: form.value.supervisor!.id,
    description: form.value.description!,
    startDate: form.value.startDate || null,
    endDate: form.value.endDate || null,
  };
}

export function initialTasksFromFormArray(arr: FormArray<ResearchPlanTaskForm>): CreateResearchPlanTask[] {
  return arr.controls.map(createResearchPlanTaskFromForm)
}


export function researchPlanTaskSlicesFromFormArray(arr: FormArray<ResearchPlanTaskForm>): ResearchPlanTaskSlice[] {
  const allSlices = arr.controls.flatMap((control, index) => {
    if (!control.touched) {
      return [];
    }
    return [{ startIndex: index, endIndex: index + 1, items: [createResearchPlanTaskFromForm(control)] }];
  })

  const mergedSlices = [];
  let currentSlice: ResearchPlanTaskSlice | null = null
  for (const slice of allSlices) {
    if (currentSlice == null) {
      currentSlice = slice;
      continue;
    }
    if (currentSlice.endIndex == slice.startIndex) {
      currentSlice = {
        startIndex: currentSlice.startIndex,
        endIndex: slice.endIndex,
        items: [...currentSlice.items, ...slice.items]
      }
    } else {
      mergedSlices.push(currentSlice);
      currentSlice = null;
    }
  }
  if (currentSlice != null) {
    mergedSlices.push(currentSlice);
  }
  return mergedSlices;
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
    TextFieldModule,

    LabSearchComponent,
    UserSearchComponent
  ],
  template: `
    <div class="controls" [formGroup]="form!">
      <div class="base-controls">
        <mat-form-field class="description-field">
          <mat-label>Description</mat-label>
          <textarea matInput cdkTextareaAutosize
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
    </div>

      @if (!hideReviewControls) {
        <div class="review-controls">
          <mat-form-field>
            <mat-label>Lab</mat-label>
          <lab-search formControlName="lab" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>Technician</mat-label>
            <user-search formControlName="supervisor" [includeRoles]="technicianRoles" />
          </mat-form-field>
        </div>
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
    width: 100%;
  }

  .base-controls, .review-controls {
    display: flex;
    flex-grow: 1;
  }

  .review-controls > * {
    flex-grow: 1;
  }

  .review-controls user-search {
    margin-left: 1em;
  }

  .duration-field {
    padding-left: 1em;
    box-sizing: border-box;
  }
  .description-field {
    flex-grow: 1;
  }


  .index {
    min-width: 3em;
    display: flex;
    justify-content: center;
  }
  `
})
export class ResearchPlanTaskFormComponent {
  @Input({ required: true })
  form: ResearchPlanTaskForm | undefined;

  @Input()
  get defaultSupervisor() {
    return this._defaultSupervisor;
  }
  set defaultSupervisor(supervisor: User | null) {
    if (!this.form?.value.supervisor) {
      this.form?.patchValue({ supervisor });
    }
    this._defaultSupervisor = supervisor;
  }
  _defaultSupervisor: User | null = null;

  @Input()
  get defaultLab(): Lab | null {
    return this._defaultLab;
  }
  set defaultLab(lab: Lab | null) {
    if (!this.form?.value.lab) {
      this.form!.patchValue({ lab });
    }
    this._defaultLab = lab;
  }
  _defaultLab: Lab | null = null;

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
    const roles = new Set(['lab-tech']);
    const lab = this.form?.value.lab;

    if (lab) {
      roles.add(`lab-tech-${lab.discipline}`)
    }
    return Array.from(roles);
  }
}