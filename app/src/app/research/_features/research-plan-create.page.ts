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
  ResearchPlanContext,
  CreateResearchPlan,
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
    <h1>Create experimental plan</h1>

    @if (currentUser$ | async; as currentUser) {
      <research-plan-form 
        hideReviewControls
        [currentUserPlanRole]="currentUser.roles.has('student') ? 'researcher' : 'coordinator'"
        [currentUserId]="currentUser.id"
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
  providers: [ ResearchPlanContext ],
})
export class ResearchPlanCreatePage {
  readonly _cdRef = inject(ChangeDetectorRef);

  readonly _router = inject(Router);
  readonly _activatedRoute = inject(ActivatedRoute);

  readonly plans = inject(ResearchPlanService);
  readonly _context: ResearchPlanContext = inject(ResearchPlanContext);

  readonly _user = inject(UserContext);
  readonly currentUser$ = this._user.user.pipe(
    filter((u): u is CurrentUser => u != null)
  );

  async onSave(patch: CreateResearchPlan) {
    const created = await firstValueFrom(this.plans.create(patch));
    await this._router.navigate([ 'research', 'plans', created.id ]);
  }
}
