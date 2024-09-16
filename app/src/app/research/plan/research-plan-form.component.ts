
import { Observable, distinctUntilChanged, firstValueFrom, map, of, switchMap } from 'rxjs';

import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UniCampusSelect } from 'src/app/uni/campus/campus-select.component';
import { UniDisciplineSelect } from 'src/app/uni/discipline/discipline-select.component';
import { UserSearchComponent } from 'src/app/user/user-search.component';

import { Lab, LabService } from 'src/app/lab/lab';
import { User } from 'src/app/user/user';
import { ResearchFunding } from '../funding/research-funding';
import { ResearchFundingSelectComponent } from '../funding/research-funding-select.component';
import { CreateResearchPlan, ResearchPlan, ResearchPlanService, UpdateResearchPlan } from './research-plan';
import { ResearchPlanTaskForm, ResearchPlanTaskFormComponent, initialTasksFromFormArray, researchPlanTaskForm, researchPlanTaskSlicesFromFormArray } from './task/research-plan-task-form.component';

export type ResearchPlanForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  researcher: FormControl<User | null>;
  coordinator: FormControl<User | null>;
  funding: FormControl<ResearchFunding | null>;
  tasks: FormArray<ResearchPlanTaskForm>;
}>;

export function researchPlanForm(plan: ResearchPlan | null = null) {

  let tasks: FormArray<ResearchPlanTaskForm>;
  if (plan != null) {
    tasks = new FormArray(plan.tasks.items.map(task => researchPlanTaskForm(task)));
  } else {
    tasks = new FormArray([
      researchPlanTaskForm()
    ]);
  }

  return new FormGroup({
    title: new FormControl<string>(plan?.title || '', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl<string>(plan?.description || '', {
      nonNullable: true,
    }),
    researcher: new FormControl<User | null>(plan?.researcher || null, {
      validators: [Validators.required],
    }),
    coordinator: new FormControl<User | null>(plan?.coordinator || null, {
      validators: [Validators.required]
    }),
    funding: new FormControl<ResearchFunding | null>(plan?.funding || null, {
      validators: [Validators.required],
    }),
    tasks
  });
}

function patchFormValue(form: ResearchPlanForm, plan: ResearchPlan) {
  form.patchValue({
    title: plan.title,
    description: plan.description,
    researcher: plan.researcher,
    funding: plan.funding
  })

  form.controls.tasks.clear();
  const tasks = form.controls.tasks;
  for (const task of plan.tasks.items) {
    tasks.controls.push(researchPlanTaskForm(task))
  }
}

function createResearchPlanFromForm(form: ResearchPlanForm): CreateResearchPlan {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }
  const value = form.value;
  return {
    title: value.title!,
    description: value.description!,
    researcher: value.researcher!.id,
    coordinator: value.coordinator!.id,
    funding: value.funding!.id,
    tasks: initialTasksFromFormArray(form.controls.tasks)
  }
}

function updateResearchPlanFromForm(form: ResearchPlanForm): UpdateResearchPlan {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }

  const value = form.value;

  return {
    title: value.title!,
    description: value.description!,
    funding: value.funding || null,
    tasks: researchPlanTaskSlicesFromFormArray(form.controls.tasks)
  };
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

    ResearchFundingSelectComponent,
    UserSearchComponent,
    ResearchPlanTaskFormComponent
  ],
  template: `
    <form [formGroup]="form">
      @if (!plan) {
        <mat-form-field>
          <mat-label>Project title</mat-label>
          <input matInput type="text" formControlName="title" required />
          @if (titleErrors && titleErrors['required']) {
            <mat-error>A value is required</mat-error>
          }
        </mat-form-field>
      }

      <mat-form-field>
        <mat-label>Experimental Plan Summary</mat-label>
        <textarea
          matInput
          id="process-summary"
          formControlName="description"
        >
        </textarea>
      </mat-form-field>

      @if (!hideReviewControls) {
        @switch (currentUserPlanRole) {

          @case ('coordinator') {
            <mat-form-field>
              <mat-label>Primary researcher</mat-label>
              <user-search formControlName="researcher"
                           [includeRoles]="_userSearchIncludeRoles"
                           allowNotFound
                           required />

              @if (researcherErrors && researcherErrors['required']) {
                <mat-error>A value is required</mat-error>
              }
            </mat-form-field>
          }
          @case ('researcher') {
            <mat-form-field>
              <mat-label>Coordinator</mat-label>
              <user-search formControlName="coordinator"
                           [includeRoles]="_userSearchIncludeRoles"
                           allowNotFound
                           required />

              @if (coordinatorErrors && coordinatorErrors['required']) {
                <mat-error>A value is required</mat-error>
              }
            </mat-form-field>
          }
        }
      }

      <research-funding-select formControlName="funding" required>
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
            <div class="task-index">
              <b>{{$index + 1}}</b>
            </div>
            <research-plan-task-form
              [index]="$index"
              [form]="control"
              [defaultLab]="researcherDefaultLab$ | async"
              [defaultSupervisor]="coordinator$ | async"
              [hideReviewControls]="hideReviewControls" />
          </mat-card>
        }
      </div>

      <div class="form-controls">
        <div (mouseenter)="_showAllFormErrors()">
          <button mat-raised-button
                  color="primary"
                  [disabled]="!form.valid"
                  (click)="onSaveButtonClick()">
            <mat-icon>save</mat-icon> SAVE
          </button>
          <button mat-raised-button
                  color="warn"
                  (click)="onCancelButtonClick()">
            <mat-icon>clear</mat-icon> CANCEL
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

      button + button {
        margin-left: 1em;
      }
    `,
  ],
})
export class ResearchPlanFormComponent {

  readonly _labService = inject(LabService);
  readonly _researchPlanService = inject(ResearchPlanService);

  @Input()
  get plan(): ResearchPlan | null { return this._plan; }
  set plan(value: ResearchPlan) {
    this._plan = value;
    patchFormValue(this.form, value);
  }
  _plan: ResearchPlan | null = null;

  @Output()
  readonly save = new EventEmitter<ResearchPlan>();

  @Output()
  readonly cancel = new EventEmitter<void>();

  @Input({ required: true })
  get currentUser(): User {
    return this._currentUser!;
  }
  set currentUser(user: User) {
    this._currentUser = user;
    window.setTimeout(() =>
      this.form.patchValue({ [this.currentUserPlanRole]: this._currentUser })
    );
  }

  _currentUser: User | undefined;

  get currentUserPlanRole() {
    return (this.currentUser && this.currentUser!.roles.has('student')) ? 'researcher' : 'coordinator';
  }

  _userSearchIncludeRoles: string[] = [];

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
      validators: [Validators.required],
    }),
    description: new FormControl<string>('', {
      nonNullable: true,
    }),
    researcher: new FormControl<User | null>(null, {
      validators: [Validators.required],
    }),
    coordinator: new FormControl<User | null>(null, {
      validators: [Validators.required]
    }),
    funding: new FormControl<ResearchFunding | null>(null, {
      validators: [Validators.required],
    }),
    tasks: new FormArray<ResearchPlanTaskForm>([
      // At least one task is always necessary
      researchPlanTaskForm()
    ]),
  });

  ngOnInit() {
    switch (this.currentUserPlanRole) {
      case 'coordinator':
        if (!this._userSearchIncludeRoles.includes('student')) {
          this._userSearchIncludeRoles = [
            ...this._userSearchIncludeRoles,
            'student'
          ]
        }
        break;
      case 'researcher':
        if (!this._userSearchIncludeRoles.includes('researcher')) {
          this._userSearchIncludeRoles = [
            ...this._userSearchIncludeRoles,
            'researcher'
          ]
        }
        if (!this._userSearchIncludeRoles.includes('lab-tech')) {
          this._userSearchIncludeRoles = [
            ...this._userSearchIncludeRoles,
            'lab-tech'
          ]
        }
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

  readonly researcherDefaultLab$: Observable<Lab | null> = this.form.valueChanges.pipe(
    takeUntilDestroyed(),
    map(value => value.researcher || null),
    distinctUntilChanged(),
    switchMap(researcher => {
      const researcherDiscipline = researcher?.primaryDiscipline;
      const researcherCampus = researcher?.baseCampus;

      if (researcherDiscipline && researcherCampus) {
        return this._labService.query({
          discipline: researcherDiscipline,
          campus: researcherCampus
        }).pipe(
          map(labs => labs[0] || null)
        )
      }
      return of(null);
    }),
  );

  get researcherErrors() {
    return this.form.controls.researcher.errors;
  }

  readonly coordinator$: Observable<User | null> = this.form.valueChanges.pipe(
    takeUntilDestroyed(),
    map(value => value.coordinator || null),
    distinctUntilChanged()
  );

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

  async onSaveButtonClick() {
    if (!this.form.valid) {
      throw new Error('Cannot save invalid form');
    }
    let savedPlan: ResearchPlan;
    if (this.plan) {
      savedPlan = await firstValueFrom(this._researchPlanService.update(
        this.plan,
        updateResearchPlanFromForm(this.form)
      ))
    } else {
      savedPlan = await firstValueFrom(this._researchPlanService.create(
        createResearchPlanFromForm(this.form)
      ));
    }
  }
  onCancelButtonClick() {
    this.cancel.emit();
  }
}
