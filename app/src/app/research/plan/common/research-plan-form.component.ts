import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CampusSearchComponent } from 'src/app/uni/campus/campus-search.component';
import { DisciplineSelectComponent } from 'src/app/uni/discipline/discipline-select.component';
import { ResearchFunding } from 'src/app/research/funding/funding-model';
import { Equipment } from 'src/app/lab/equipment/common/equipment';

import { FundingModelSearchComponent } from 'src/app/research/funding/funding-model-search.component';
import { ResearchPlanPatch } from './research-plan';
import {
  ExperimentalPlanForm,
  ExperimentalPlanFormErrors,
} from './research-plan-form';
import { ResearchPlanResearcherFormComponent } from '../researcher/researcher-form.component';
import { ResearchFundingSelectComponent } from 'src/app/research/funding/funding-model-select.component';

@Component({
  selector: 'lab-experimental-plan-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,

    DisciplineSelectComponent,
    FundingModelSearchComponent,
    ResearchFundingSelectComponent,
    CampusSearchComponent,
    ResearchPlanResearcherFormComponent,
  ],
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label for="title">Project title</mat-label>

        <input
          matInput
          type="text"
          id="title"
          formControlName="title"
          required
        />

        @if (titleErrors?.required) {
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

      <uni-research-funding-model-select formControlName="fundingModel">
        <mat-label>Funding source</mat-label>

        @if (fundingModelErrors?.required) {
          <span class="error">A value is required</span>
        }
        @if (fundingModelErrors?.notAFundingModel) {
          <span class="error">Unrecognised funding source</span>
        }
      </uni-research-funding-model-select>

      <ng-content select=".form-controls"> </ng-content>
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
  committed: Equipment | null = null;

  @Input({ required: true })
  form: ExperimentalPlanForm;

  @Output()
  requestCommit = new EventEmitter<ResearchPlanPatch>();

  @Output()
  requestReset = new EventEmitter<void>();

  get isCreate() {
    return this.committed === null;
  }

  get titleErrors(): ExperimentalPlanFormErrors['title'] {
    return this.form.controls['title'].errors || (null as any);
  }

  get fundingModel(): ResearchFunding | string | null {
    return this.form.controls.fundingModel.value;
  }

  get fundingModelErrors(): ExperimentalPlanFormErrors['fundingModel'] {
    return this.form.controls['fundingModel'].errors || (null as any);
  }

  @Input()
  controls: TemplateRef<{
    $implicit: ExperimentalPlanForm;
    committable: boolean;
    doCommit: () => void;
    doReset: () => void;
  }>;

  @Input()
  get disabled(): boolean {
    return this.form.disabled;
  }
  set disabled(value: BooleanInput) {
    const isDisabled = coerceBooleanProperty(value);
    if (isDisabled && !this.form.disabled) {
      this.form.disable();
    }
    if (!isDisabled && this.form.disabled) {
      this.form.enable();
    }
  }
}
