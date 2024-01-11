import {
  ChangeDetectorRef,
  Component,
  Inject,
  Injectable,
  Optional,
  SkipSelf,
  ViewChild,
  inject,
} from '@angular/core';
import {
  Subject,
  Subscription,
  filter,
  first,
  firstValueFrom,
  map,
  of,
} from 'rxjs';
import { ResearchPlanFormComponent } from '../plan/common/research-plan-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  experimentalPlanForm,
  experimentalPlanPatchFromForm,
} from '../plan/common/research-plan-form';

import { ModelContext } from 'src/app/common/model/context';
import {
  ResearchPlanContext,
  ResearchPlanPatch,
  injectResearchPlanService,
} from '../plan/common/research-plan';

const experimentalPlanCreateFixture: Partial<ResearchPlanPatch> = {
  title: 'The importance of being earnest',
  processSummary: 'Behave earnestly, then deceptively and observe changes.',
  fundingModel: 'Grant',
  researcher: 'a@researcher',
  researcherDiscipline: 'ICT',
  researcherBaseCampus: 'MEL',
  supervisor: null,
  addWorkUnits: [],
};

@Component({
  selector: 'lab-experimental-plan-create-page',
  template: `
    <h1>Create experimental plan</h1>

    <lab-experimental-plan-form [form]="form">
      <div class="form-controls" (mouseenter)="_showAllFormErrors()">
        {{ form.status }}
        {{ form.errors | json }}
        <button
          mat-raised-button
          [disabled]="!form.valid"
          (click)="save(); $event.stopPropagation()"
        >
          <mat-icon>save</mat-icon> SAVE
        </button>
      </div>
    </lab-experimental-plan-form>
  `,
  styles: [
    `
      .form-controls {
        display: flex;
        justify-content: right;
      }
    `,
  ],
  providers: [ResearchPlanContext],
})
export class ResearchPlanCreatePage {
  readonly _cdRef = inject(ChangeDetectorRef);

  readonly _router = inject(Router);
  readonly _activatedRoute = inject(ActivatedRoute);

  readonly plans = injectResearchPlanService();
  readonly _context: ResearchPlanContext = inject(ResearchPlanContext);

  readonly form = experimentalPlanForm();
  readonly patch$ = experimentalPlanPatchFromForm(this.form);

  ngAfterViewInit() {
    this.form.patchValue({
      ...experimentalPlanCreateFixture,
      addWorkUnits: [],
    });
    this._cdRef.detectChanges();
  }

  async save() {
    if (!this.form.valid) {
      throw new Error('Cannot save invalid form');
    }
    const patch = await firstValueFrom(this.patch$);
    const result = await firstValueFrom(this.plans.create(patch));
    return await this._router.navigate(['/lab/experimental-plans', result.id]);
  }

  _showAllFormErrors() {
    this.form.markAllAsTouched();
  }
}
