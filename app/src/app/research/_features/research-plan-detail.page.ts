import {
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Observable,
  defer,
  distinctUntilChanged,
  firstValueFrom,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { MatTabsModule } from "@angular/material/tabs";
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  ResearchPlan,
  ResearchPlanService,
} from '../plan/research-plan';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ResearchPlanDetailConfig, injectResearchPlanDetailConfig } from './research-plan-detail.state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ResearchPlanContext } from '../plan/research-plan-context';
import { UserInfoComponent } from 'src/app/user/user-info.component';
import { MatListModule } from '@angular/material/list';
import { ResearchPlanTaskCardComponent } from '../plan/task/research-plan-task-card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LabService } from 'src/app/lab/lab';
import { LabResourceContainerFormComponent } from 'src/app/lab/lab-resource/resource-container-form.component';
import { ResearchPlanForm, researchPlanForm } from '../plan/research-plan-form.component';
import { DisciplinePipe } from 'src/app/uni/discipline/discipline.pipe';
import { ResearchPlanForm__TitleField } from '../plan/form/research-plan-form--title-field.component';
import { ResearchPlanForm__DescriptionField } from '../plan/form/research-plan-form--description-field.component';
import { ResearchPlanForm__CoordinatorField } from '../plan/form/research-plan-form--coordinator-field.component';
import { ResearchPlanForm__ResearcherField } from '../plan/form/research-plan-form--researcher-field.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ResearchPlanForm__FundingField } from '../plan/form/research-plan-form--funding-field.component';

export function researchPlanContextFromDetailRoute(): Observable<ResearchPlan> {
  const activatedRoute = inject(ActivatedRoute);
  const models = inject(ResearchPlanService);

  return defer(() =>
    activatedRoute.paramMap.pipe(
      map((paramMap) => paramMap.get('experimental_plan_id')),
      switchMap((experimentalPlanId) => {
        if (experimentalPlanId == null) {
          throw new Error('No experimental plan in params');
        }
        return models.fetch(experimentalPlanId);
      }),
    ),
  );
}

@Component({
  selector: 'research-plan-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,

    MatTabsModule,

    DisciplinePipe,
    ResearchPlanForm__TitleField,
    ResearchPlanForm__DescriptionField,
    ResearchPlanForm__FundingField,
    ResearchPlanForm__CoordinatorField,
    ResearchPlanForm__ResearcherField
  ],
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  template: `
  @if (plan$ | async; as plan) {
    <ng-container [formGroup]="_updateForm!">
      <div class="page-header">
        <div class="page-title">
          <h1>
            {{plan.discipline | uniDiscipline}} research plan
          </h1>
          <research-plan-form--title-field
            [plan]="plan"
            [contentEditable]="isEditingField('title')"
            (contentEditableToggle)="onContentEditableToggled('title', $event)"
            (contentChange)="onContentChange('title', $event)"
          />
        </div>
      </div>
      <div class="page-body">
        <div class="section-title">
          <h2 class="section-title">General</h2>
        </div>

        <research-plan-form--description-field 
            [plan]="plan" 
            [contentEditable]="isEditingField('description')"
            (contentEditableToggle)="onContentEditableToggled('description', $event)"
            (contentChange)="onContentChange('description', $event)" />

          <research-plan-form--funding-field
            [plan]="plan!"
            [contentEditable]="isEditingField('funding')"
            (contentEditableToggle)="onContentEditableToggled('funding', $event)"
            (contentChange)="onContentChange('funding', $event)" />

        <research-plan-form--coordinator-field
            [plan]="plan!"
            [contentEditable]="isEditingField('coordinator')"
            (contentEditableToggle)="onContentEditableToggled('coordinator', $event)"
            (contentChange)="onContentChange('coordinator', $event)" />
          
        <research-plan-form--researcher-field
            [plan]="plan!"
            [contentEditable]="isEditingField('researcher')"
            (contentEditableToggle)="onContentEditableToggled('researcher', $event)"
            (contentChange)="onContentChange('researcher', $event)" />

      </div>
    </ng-container>

    <nav mat-tab-nav-bar [tabPanel]="tabPanel">
      <a mat-tab-link routerLink="./">Tasks</a>
      <a mat-tab-link routerLink="./requirements">Requirements</a>
    </nav>

    <mat-tab-nav-panel #tabPanel>
      <div class="child-content">
        <router-outlet />
      </div>
    </mat-tab-nav-panel>
  }

  `,
  styles: `
    h1 {
      margin-bottom: 0.15em;
    }
    .general-info-header {
      display: flex;
      justify-content: space-between;
    }
    mat-card-header {
      padding: 0;
    }
  `,
})
export class ResearchPlanDetailPage {
  readonly isEditingForm = true;

  readonly _labService = inject(LabService);
  readonly _planService = inject(ResearchPlanService);
  readonly _context = inject(ResearchPlanContext);

  _updateForm: ResearchPlanForm | undefined;

  readonly appScaffold = inject(BodyScrollbarHidingService);
  readonly plan$ = this._context.committed$;

  readonly config$ = injectResearchPlanDetailConfig();

  readonly showPlanSummary$ = this.config$.pipe(map(config => config.showPlanSummary));
  readonly showEditButton$ = this.config$.pipe(map(config => config.showEditButton));
  readonly editButtonDisabled$ = this.config$.pipe(map(config => config.editButtonDisabled));
  readonly showGeneralInfo$ = this.config$.pipe(map(config => config.showGeneralInfo));
  readonly showTaskInfo$ = this.config$.pipe(map(config => config.showTasks))
  readonly showRequirements$ = this.config$.pipe(map(config => config.showRequirements));

  constructor() {
    this.plan$.pipe(
      takeUntilDestroyed(),
      map(plan => researchPlanForm(plan))
    ).subscribe(form => {
      this._updateForm = form;
    });
  }

  readonly lab$ = this.plan$.pipe(
    distinctUntilChanged(),
    switchMap(plan => plan.resolveLab(this._labService))
  )

  readonly editFields = new Set<keyof ResearchPlanForm[ 'controls' ]>();

  isEditingField(name: keyof ResearchPlanForm[ 'controls' ]): boolean {
    return this.editFields.has(name);
  }

  onContentEditableToggled(name: keyof ResearchPlanForm[ 'controls' ], isEditable: boolean) {
    if (isEditable && !this.editFields.has(name)) {
      this.editFields.add(name);
    }
    if (!isEditable && this.editFields.has(name)) {
      this.editFields.delete(name)
    }
  }

  async onContentChange<K extends keyof ResearchPlanForm[ 'controls' ]>(
    name: K,
    value: ResearchPlanForm[ 'value' ][ K ]
  ) {
    let plan = await firstValueFrom(this.plan$);
    plan = await firstValueFrom(
      this._planService.update(plan, { [ name ]: value })
    );
    this._context.nextCommitted(plan);
  }

  isEditingGeneralInfo = false;
  toggleEditingGeneralInfo(isEditing = false) {
    for (const field of [ 'description', 'coordinator', 'researcher' ]) {
      if (isEditing) {
        this.editFields.add(field as any);
      } else {
        this.editFields.delete(field as any);
      }
    }
    this.isEditingGeneralInfo = isEditing;
  }

  cancelEditGeneralInfo() {
    this._updateForm!.reset();
    this.toggleEditingGeneralInfo(false);
  }
  saveGeneralInfo() {
  }

}