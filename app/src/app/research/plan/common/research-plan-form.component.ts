import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
  inject,
} from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CampusSearchComponent } from 'src/app/uni/campus/campus-search.component';
import { DisciplineSelectComponent } from 'src/app/uni/discipline/discipline-select.component';
import { Equipment } from 'src/app/lab/equipment/common/equipment';

import { ResearchPlan, CreateResearchPlan } from './research-plan';
import { ResearchFunding, ResearchFundingLookup, ResearchFundingService } from '../../funding/research-funding';
import { ResearchFundingSearchComponent } from '../../funding/research-funding-search.component';
import { ResearchFundingSelectComponent } from '../../funding/research-funding-select.component';
import { User, UserLookup } from 'src/app/user/common/user';
import { ResearchPlanTaskForm, createResearchPlanTaskFromForm, researchPlanTaskForm } from '../task/research-plan-task-form.component';
import { MatIconModule } from '@angular/material/icon';
import { isResearchFundingIdOrLookupValidator } from '../../funding/is-research-funding-or-research-funding-name-validator';
import { ResourceContainerFormControls, resourceContainerFormControls } from 'src/app/lab/lab-resource/resource-container-form.service';
import { CreateResearchPlanTask } from '../task/research-plan-task';
import { UserSearchComponent } from 'src/app/user/common/user-search.component';

export type ResearchPlanForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  researcher: FormControl<UserLookup | string | null>;
  coordinator: FormControl<UserLookup | string | null>;
  funding: FormControl<ResearchFundingLookup | string | null>;
  tasks: FormArray<ResearchPlanTaskForm>;
} & ResourceContainerFormControls>;

function patchFormValue(form: ResearchPlanForm, plan: ResearchPlan) {
  form.patchValue({
    title: plan.title,
    description: plan.description,
    researcher: plan.researcher,
    funding: plan.funding
  })

  const tasks = form.controls.tasks;
  for (let i = 0; i < plan.tasks.length; i++) {
    const task = plan.tasks[ i ];
    let taskForm = tasks.controls[ i ];
    if (taskForm == null) {
      tasks.controls.push(researchPlanTaskForm(task))
    }
  }
}

function createResearchPlanFromForm(form: ResearchPlanForm): CreateResearchPlan {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }
  const patch = {
    title: form.value.title!,
    description: form.value.description!,
    researcher: form.value.researcher || null,
    coordinator: form.value.coordinator || null,
    funding: form.value.funding!,
    tasks: {
      startIndex: 0,
      items: <CreateResearchPlanTask[]>[]
    }
  }

  const createTasks: CreateResearchPlanTask[] = [];

  const taskForms = form.controls.tasks;
  taskForms.controls.forEach((taskForm) => {
    const createTask = createResearchPlanTaskFromForm(taskForm);
    patch[ 'tasks' ][ 'items' ].push(createTask)
  });

  return patch;

}



@Component({
  selector: 'research-plan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,

    DisciplineSelectComponent,
    ResearchFundingSelectComponent,
    CampusSearchComponent,
    UserSearchComponent
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Project title</mat-label>
        <input matInput type="text" formControlName="title" required />
        @if (titleErrors && titleErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>Experimental Plan Summary</mat-label>
        <textarea
          matInput
          id="process-summary"
          formControlName="description"
        >
        </textarea>
      </mat-form-field>

      <user-search formControlName="researcher"
        createTemporaryIfNotFound>
        <mat-label>Primary researcher</mat-label>

        @if (researcherErrors && researcherErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
      </user-search>

      <research-funding-select formControlName="funding">
        <mat-label>Funding source</mat-label>

        @if (fundingErrors && fundingErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
        @if (fundingErrors && fundingErrors['notAFundingModel']) {
          <mat-error>Unrecognised funding source</mat-error>
        }
      </research-funding-select>

      <div class="form-controls" (mouseenter)="_showAllFormErrors()">
        <button mat-raised-button [disabled]="!form.valid" (click)="onSaveButtonClick()">
          <mat-icon>save</mat-icon> SAVE
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      mat-card + mat-card {
        margin-top: 1em;
      }

      mat-form-field {
        width: 100%;
      }

      .researcher-details {
        padding-left: 3em;
      }
    `,
  ],
})
export class ResearchPlanFormComponent {
  @Input()
  get plan(): ResearchPlan | null { return this._plan; }
  set plan(value: ResearchPlan) {
    this._plan = value;
    patchFormValue(this.form, value);
  }
  _plan: ResearchPlan | null = null;


  readonly form: ResearchPlanForm = new FormGroup({
    title: new FormControl<string>('', {
      nonNullable: true,
      validators: [ Validators.required ],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
    researcher: new FormControl<UserLookup | string | null>(null, {
      validators: [ Validators.required ],
    }),
    coordinator: new FormControl<UserLookup | string | null>(null, {
      validators: [ Validators.required ]
    }),
    funding: new FormControl<ResearchFundingLookup | string | null>(null, {
      validators: [ Validators.required ],
      asyncValidators: [ isResearchFundingIdOrLookupValidator() ],
    }),
    tasks: new FormArray<ResearchPlanTaskForm>([]),
    ...resourceContainerFormControls()
  });

  @Output()
  save = new EventEmitter<CreateResearchPlan>()

  get titleErrors() {
    return this.form.controls.title.errors || null;
  }

  get funding(): ResearchFundingLookup | string | null {
    return this.form.controls.funding.value || null;
  }

  get fundingErrors(): ValidationErrors | null {
    return this.form.controls.funding.errors;
  }

  get researcherErrors() {
    return this.form.controls.researcher.errors;
  }

  @Input()
  get disabled(): boolean {
    return this.form!.disabled;
  }
  set disabled(value: BooleanInput) {
    const isDisabled = coerceBooleanProperty(value);
    if (isDisabled && !this.form!.disabled) {
      this.form!.disable();
    }
    if (!isDisabled && this.form!.disabled) {
      this.form!.enable();
    }
  }

  _showAllFormErrors() {
    this.form.markAllAsTouched();
  }

  onSaveButtonClick() {
    if (!this.form.valid) {
      throw new Error('Cannot save invalid form');
    }
    if (this.plan) {
    }

  }
}
