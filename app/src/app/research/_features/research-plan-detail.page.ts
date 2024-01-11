import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subscription,
  defer,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';
import { ResearchPlanFormPaneControl } from '../plan/common/research-plan-form-pane-control';
import { BodyScrollbarHidingService } from 'src/app/utils/body-scrollbar-hiding.service';
import {
  ResearchPlan,
  ResearchPlanContext,
  ResearchPlanService,
} from '../plan/common/research-plan';

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
    <div
      class="resource-form-pane"
      [class.resource-form-pane-isopen]="_formPaneService.isOpen$ | async"
    >
      <div class="sticky-top">
        <router-outlet name="form"></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      mat-card-header {
        padding: 0;
      }

      .resource-form-pane {
        position: absolute;
        top: 0;
        right: 0;
        height: 100%;
        max-width: 40vw;
        background-color: white;
        z-index: 100;
      }

      .resource-form-pane .sticky-top {
        width: 100%;
        height: 100vh;
        position: sticky;
        top: 0;
      }
    `,
  ],
  providers: [ResearchPlanFormPaneControl],
})
export class ResearchPlanDetailPage {
  readonly isEditingForm = true;

  readonly _context = inject(ResearchPlanContext);
  _contextConnection: Subscription;

  readonly _formPaneService = inject(ResearchPlanFormPaneControl);
  @ViewChild(ElementRef, { static: true })
  readonly formPane: ElementRef<any>;

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
