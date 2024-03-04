import {
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Observable,
  defer,
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
import { ResearchPlanTaskInfoComponent } from '../plan/task/research-plan-task-info.component';

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

    MatCardModule,
    MatListModule,
    MatTabsModule,
    UserInfoComponent,
    ResearchPlanTaskInfoComponent,
  ],
  host: {
    '[class.scaffold-content-full-width]': 'true'
  },
  template: `
  @if (plan$ | async; as plan) {
    <div class="page-header">
      <div class="page-title">
        <h1>
          {{ plan!.title }} 
        </h1>
        <div class="subtitle">Research {{ plan!.funding.name }} project</div>
      </div> 
    </div>
    <div class="description">
      <b>Experimental plan summary</b>
      <p>{{plan!.description}}</p>
    </div>
    <b>Researcher</b> <user-info [user]="plan!.researcher" /> <br/>
    <b>Coordinator</b> <user-info [user]="plan!.coordinator" /> <br/>

    <h2>Tasks</h2>
    <mat-list>
      @for (task of plan!.tasks; track task.id) {
        <mat-list-item>
          <research-plan-task-info [task]="task" />
        </mat-list-item>
      }
    </mat-list>

    <!--
      <mat-card>
        <mat-card-header>
          <nav
            mat-tab-nav-bar
            [tabPanel]="tabPanel"
            mat-align-tabs="start"
            mat-stretch-tabs="false"
          >
            @for (
              workUnit of plan.workUnits;
              track workUnit.id;
              let index = $index
            ) {
              <a
                mat-tab-link
                [routerLink]="['./', 'work-units', index]"
                routerLinkActive
                #linkActive="routerLinkActive"
                [active]="linkActive.isActive"
              >
                {{ workUnit.campus.name }} - {{ workUnit.labType }}
              </a>
            }
            <div class="spacer" [style.flex-grow]="1"></div>
            <a
              mat-tab-link
              #createLink
              routerLink="./work-units/create"
              routerLinkActive
              #linkActive="routerLinkActive"
              [active]="linkActive.isActive"
              [disabled]="linkActive.isActive"
            >
              <mat-icon>+</mat-icon>
            </a>
          </nav>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-nav-panel #tabPanel>
            <router-outlet></router-outlet>
          </mat-tab-nav-panel>
        </mat-card-content>
      </mat-card>
          -->
  }
  `,
  styles: [
    `
      mat-card-header {
        padding: 0;
      }

    `,
  ],
})
export class ResearchPlanDetailPage {
  readonly isEditingForm = true;

  readonly _context = inject(ResearchPlanContext);

  readonly appScaffold = inject(BodyScrollbarHidingService);
  readonly plan$ = this._context.committed$;


  readonly config$ = injectResearchPlanDetailConfig().pipe(
    takeUntilDestroyed(),
    shareReplay(1)
  )

  readonly showPlanSummary$ = this.config$.pipe(map(config => config.showPlanSummary));
}