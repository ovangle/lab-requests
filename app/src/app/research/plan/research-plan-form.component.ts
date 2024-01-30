import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  Output,
  TemplateRef,
  forwardRef,
  inject,
} from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CampusSearchComponent } from 'src/app/uni/campus/campus-search.component';
import { DisciplineSelectComponent } from 'src/app/uni/discipline/discipline-select.component';

import { ResearchPlan, CreateResearchPlan } from './research-plan';
import { ResearchFunding } from '../funding/research-funding';
import { ResearchFundingSelectComponent } from '../funding/research-funding-select.component';
import { UserLookup } from 'src/app/user/common/user';
import { ResearchPlanTaskForm, ResearchPlanTaskFormComponent, createResearchPlanTaskFromForm, researchPlanTaskForm } from './task/research-plan-task-form.component';
import { MatIconModule } from '@angular/material/icon';
import { ResourceContainerFormControls, ResourceContainerControl, resourceContainerFormControls } from 'src/app/lab/lab-resource/resource-container-form-control';
import { CreateResearchPlanTask } from './task/research-plan-task';
import { UserSearchComponent } from 'src/app/user/common/user-search.component';
import { MatButtonModule } from '@angular/material/button';
import { format } from 'date-fns';
import { MatCardModule } from '@angular/material/card';
import { ALL_RESOURCE_TYPES, ResourceType } from 'src/app/lab/lab-resource/resource-type';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { S } from '@angular/cdk/keycodes';
import { LabResourceContainerFormComponent } from 'src/app/lab/lab-resource/resource-container-form.component';
import { ResourceContainer, ResourceContainerContext, ResourceContainerPatch, resourceContainerAttr } from 'src/app/lab/lab-resource/resource-container';

export type ResearchPlanForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  researcher: FormControl<UserLookup | string | null>;
  coordinator: FormControl<UserLookup | string | null>;
  funding: FormControl<ResearchFunding | null>;
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
    funding: form.value.funding!.id,
    tasks: {
      startIndex: 0,
      items: <CreateResearchPlanTask[]>[]
    }
  }

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

    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,

    DisciplineSelectComponent,
    ResearchFundingSelectComponent,
    CampusSearchComponent,
    UserSearchComponent,
    ResearchPlanTaskFormComponent,
    LabResourceContainerFormComponent
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

      @switch (currentUserPlanRole) {

        @case ('coordinator') {
          <user-search formControlName="researcher"
            [includeRoles]="_userSearchIncludeRoles"
            createTemporaryIfNotFound
            required >
            <mat-label>Primary researcher</mat-label>

            @if (researcherErrors && researcherErrors['required']) {
              <mat-error>A value is required</mat-error>
            }
          </user-search>
        }
        @case ('researcher') {
          <user-search formControlName="coordinator"
                       [includeRoles]="_userSearchIncludeRoles" 
                       required >
              <mat-label>Coordinator</mat-label>
              
              @if (coordinatorErrors && coordinatorErrors['required']) {
                <mat-error>A value is required</mat-error>
              }
          </user-search>
        }
      }

      <research-funding-select formControlName="funding">
        <mat-label>Funding source</mat-label>

        @if (fundingErrors && fundingErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
        @if (fundingErrors && fundingErrors['notAFundingModel']) {
          <mat-error>Unrecognised funding source</mat-error>
        }
      </research-funding-select>

      <div formArrayName="tasks" #tasksContainer>
        <h2>
          Tasks
          <button class="append-task-button" mat-raised-button (click)="onAppendTaskClick()">
            <mat-icon>add</mat-icon> Add
          </button>
        </h2>

        @for (control of taskForms; track control) {
          <mat-card>
            <research-plan-task-form 
              [index]="$index"
              [form]="control" 
              [hideReviewControls]="hideReviewControls" />
          </mat-card>
        }

        <div class="resources" #resourceContainer>
          <h2>Requirements</h2>

          <lab-resource-container-form 
            [container]="plan"
            [form]="form" />
        </div>

      </div>
      <div class="form-controls">
        <div (mouseenter)="_showAllFormErrors()">
          <button mat-raised-button [disabled]="!form.valid" 
                  (click)="onSaveButtonClick()">
            <mat-icon>save</mat-icon> SAVE
          </button>
        </div>
      </div>
    </form>
  `,
  styles: [
    `
      .form-controls {
        display: flex;
        justify-content: right;
      }

      .append-task-button {
        float: right;
      }
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

  @Input({ required: true })
  currentUserPlanRole: 'coordinator' | 'researcher' = 'researcher';

  @Input({ required: true })
  currentUserId: string | undefined;

  _userSearchIncludeRoles = new Set<string>();

  @Input()
  get hideReviewControls(): boolean {
    return this._hideReviewControls;
  }
  set hideReviewControls(value: BooleanInput) {
    this._hideReviewControls = coerceBooleanProperty(value);
  }

  _hideReviewControls = false;

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
    funding: new FormControl<ResearchFunding | null>(null, {
      validators: [ Validators.required ],
    }),
    tasks: new FormArray<ResearchPlanTaskForm>([
      // At least one task is always necessary
      researchPlanTaskForm()
    ]),
    ...resourceContainerFormControls()
  });

  @Output()
  save = new EventEmitter<CreateResearchPlan>()

  ngOnInit() {
    this.form.patchValue({ [ this.currentUserPlanRole ]: this.currentUserId! });

    switch (this.currentUserPlanRole) {
      case 'coordinator':
        this._userSearchIncludeRoles.add('student');
        break;
      case 'researcher':
        this._userSearchIncludeRoles.add('lab-tech');
        break;
    }

  }

  get titleErrors() {
    return this.form.controls.title.errors || null;
  }

  get funding(): ResearchFunding | null {
    return this.form.controls.funding.value || null;
  }

  get fundingErrors(): ValidationErrors | null {
    return this.form.controls.funding.errors;
  }

  get researcherErrors() {
    return this.form.controls.researcher.errors;
  }

  get coordinatorErrors() {
    return this.form.controls.coordinator.errors;
  }

  get taskArray(): FormArray<ResearchPlanTaskForm> {
    return this.form.controls.tasks;
  }

  get taskForms(): ResearchPlanTaskForm[] {
    return this.taskArray.controls;
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

  onAppendTaskClick() {
    this.taskArray.push(researchPlanTaskForm());
  }

  onSaveButtonClick() {
    if (!this.form.valid) {
      throw new Error('Cannot save invalid form');
    }
  }
}
