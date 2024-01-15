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

import { ResearchPlan, ResearchPlanPatch } from './research-plan';
import { ResearchPlanResearcherFormComponent } from '../researcher/researcher-form.component';
import { ResearchFunding, ResearchFundingService } from '../../funding/research-funding';
import { ResearchFundingSearchComponent } from '../../funding/research-funding-search.component';
import { ResearchFundingSelectComponent } from '../../funding/research-funding-select.component';
import { User } from 'src/app/user/common/user';
import { ResearchPlanTaskForm, researchPlanTaskForm } from '../task/research-plan-task-form.component';
import { MatIconModule } from '@angular/material/icon';
import { isFundingModelOrNameValidator } from '../../funding/is-funding-model-or-name-validator';
import { ResourceContainerFormControls } from 'src/app/lab/lab-resource/resource-container-form.service';

export type ResearchPlanForm = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  researcher: FormControl<User | null>;
  funding: FormControl<ResearchFunding | string | null>;
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
    const task = plan.tasks[i];
    let taskForm = tasks.controls[i];
    if (taskForm == null) {
      tasks.controls.push(researchPlanTaskForm(task))
    }
  }
}

function researchPlanPatchFromForm(form: ResearchPlanForm): ResearchPlanPatch {
  if (!form.valid) {
    throw new Error('Invalid form has no patch');
  }
  return {}

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
    ResearchFundingSearchComponent,
    ResearchFundingSelectComponent,
    CampusSearchComponent,
    ResearchPlanResearcherFormComponent,
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
          formControlName="processSummary"
        >
        </textarea>
      </mat-form-field>

      <research-plan-researcher-form [form]="form" />

      <research-funding-model-select formControlName="fundingModel">
        <mat-label>Funding source</mat-label>

        @if (fundingErrors && fundingErrors['required']) {
          <mat-error>A value is required</mat-error>
        }
        @if (fundingErrors && fundingErrors['notAFundingModel']) {
          <mat-error>Unrecognised funding source</mat-error>
        }
      </research-funding-model-select>

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
      validators: [Validators.required],
    }),
    description: new FormControl<string>('' {
      nonNullable: true,
    }),
    researcher: new FormControl<User | null>(null{
      nonNullable: true,
      validators: [Validators.required],
    }),
    funding: new FormControl<ResearchFunding | string | null>(null, {
      validators: [Validators.required],
      asyncValidators: [isFundingModelOrNameValidator()],
    }),
    tasks: new FormArray<ResearchPlanTaskForm>([]),
  });

  @Output()
  save = new EventEmitter<ResearchPlanPatch>()

  get titleErrors() {
    return this.form.controls.title.errors || null;
  }

  get fundingModel(): ResearchFunding | string | null {
    return this.form.controls.funding.value || null;
  }

  get fundingErrors(): ValidationErrors | null {
    return this.form.controls.funding.errors;
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
    const patch: ResearchPlanPatch = {

    }
  }
}
