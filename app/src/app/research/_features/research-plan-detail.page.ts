import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {
  Observable,
  Subscription,
  defer,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { MatTabsModule } from "@angular/material/tabs";
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  ResearchPlan,
  ResearchPlanContext,
  ResearchPlanService,
} from '../plan/research-plan';
import { CommonModule } from '@angular/common';
import { ResearchPlanInfoComponent } from '../plan/research-plan-info.component';
import { MatCardModule } from '@angular/material/card';

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
    MatTabsModule,
    ResearchPlanInfoComponent,
  ],
  template: `
    @if (plan$ | async; as plan) {
      <research-plan-info [plan]="plan" />
      <mat-card>
        <mat-card-header>
          <nav
            mat-tab-nav-bar
            [tabPanel]="tabPanel"
            mat-align-tabs="start"
            mat-stretch-tabs="false"
          >
            <!--
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
          -->
          </nav>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-nav-panel #tabPanel>
            <router-outlet></router-outlet>
          </mat-tab-nav-panel>
        </mat-card-content>
      </mat-card>
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
  _contextConnection: Subscription;

  readonly appScaffold = inject(BodyScrollbarHidingService);
  readonly plan$ = this._context.committed$;

  constructor() {
    this._contextConnection = this._context.sendCommitted(
      researchPlanContextFromDetailRoute(),
    );
  }

  ngOnDestroy() {
    this._contextConnection.unsubscribe();
  }
}
