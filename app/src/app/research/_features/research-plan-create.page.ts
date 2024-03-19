import { v4 as uuidv4 } from 'uuid';
import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  defer,
  filter,
  firstValueFrom, map,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import {
  CreateResearchPlan,
  ResearchPlan,
  ResearchPlanService,

} from '../plan/research-plan';
import { CurrentUser } from 'src/app/user/common/user';
import { UserContext } from 'src/app/user/user-context';
import { ResearchPlanFormComponent } from '../plan/research-plan-form.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lab-experimental-plan-create-page',
  standalone: true,
  imports: [
    CommonModule,
    ResearchPlanFormComponent
  ],
  template: `
    <h1>Create research plan</h1>

    @if (currentUser$ | async; as currentUser) {
      <research-plan-form 
        hideReviewControls
        [currentUser]="currentUser"
        (save)="onSave($event)" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        margin: 2em 1em;
      }
    `,
  ],
})
export class ResearchPlanCreatePage {
  readonly _cdRef = inject(ChangeDetectorRef);

  readonly _router = inject(Router);
  readonly _activatedRoute = inject(ActivatedRoute);

  readonly plans = inject(ResearchPlanService);

  readonly _user = inject(UserContext);
  readonly currentUser$ = this._user.user.pipe(
    filter((u): u is CurrentUser => u != null)
  );

  async onSave(plan: ResearchPlan) {
    await this._router.navigate([ 'research', 'plans', plan.id ]);
  }
}
