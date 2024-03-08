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
import { ResourceContainerControl } from 'src/app/lab/lab-resource/resource-container-control';

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
    RouterModule,

    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
    UserInfoComponent,
    ResearchPlanTaskCardComponent,
    LabResourceContainerFormComponent
  ],
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  template: `
  @if (plan$ | async; as plan) {
    <div class="page-header">
      <div class="page-title">
        <h1>
          Research plan
        </h1>
        <h3 class="subtitle">
          {{plan!.title}}
        </h3>
      </div>
    </div>
    <section class="general-info">
    @if (showGeneralInfo$ | async) {
      <div class="general-info-header">
        <h2>General</h2>
        @if (showEditButton$ | async) {
          <ng-container *ngTemplateOutlet="editButton" />
        }
      </div>
      <div class="funding-info">
        <b>Funding</b> {{plan!.funding.name}}
      </div>
      <div class="description">
        <b>Experimental plan summary</b>
        <p>{{plan!.description}}</p>
      </div>
      <b>Researcher</b> <user-info [user]="plan!.researcher" /> <br/>
      <b>Coordinator</b> <user-info [user]="plan!.coordinator" /> <br/>
      <b>Base lab</b>{{(lab$ | async)?.name}}
    } @else if (showEditButton$ | async) {
      <div class="general-info-header">
        <div></div>
        <ng-container *ngTemplateOutlet="editButton" />
      </div>
    }
    </section>

    @if (showTaskInfo$ | async) {
    <section class="task-info">
      <h2>Tasks</h2>
      <div>
        @for (task of plan!.tasks; track task.id) {
          <mat-list-item>
            <research-plan-task-card [task]="task" />
          </mat-list-item>
        }
      </div>
    </section>
    }

    @if (showRequirements$ | async) {
      <section class="resources" #resourceContainer>
        <h2>Requirements</h2>

        <lab-resource-container-form 
          [containerControl]="containerControl" />
      </section>
    }

    <div class="child-route">
      <router-outlet />
    </div>
  }

  <ng-template #editButton> 
    <button mat-raised-button routerLink="./update" color="primary"
      [disabled]="editButtonDisabled$ | async">
      <mat-icon>edit</mat-icon>Edit
    </button>
  </ng-template>
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

  readonly appScaffold = inject(BodyScrollbarHidingService);
  readonly plan$ = this._context.committed$;

  readonly config$ = injectResearchPlanDetailConfig();

  readonly containerControl = new ResourceContainerControl<ResearchPlan>(
    this._context,
    async (patch) => {
      const committed = await firstValueFrom(this.plan$);
      return firstValueFrom(this._planService.update(committed, patch))
    }
  );

  readonly showPlanSummary$ = this.config$.pipe(map(config => config.showPlanSummary));
  readonly showEditButton$ = this.config$.pipe(map(config => config.showEditButton));
  readonly editButtonDisabled$ = this.config$.pipe(map(config => config.editButtonDisabled));
  readonly showGeneralInfo$ = this.config$.pipe(map(config => config.showGeneralInfo));
  readonly showTaskInfo$ = this.config$.pipe(map(config => config.showTasks))
  readonly showRequirements$ = this.config$.pipe(map(config => config.showRequirements));

  readonly lab$ = this.plan$.pipe(
    distinctUntilChanged(),
    switchMap(plan => plan.resolveLab(this._labService))
  )
}