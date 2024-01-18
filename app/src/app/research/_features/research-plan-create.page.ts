import { v4 as uuidv4 } from 'uuid';
import {
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  firstValueFrom,
} from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import {
  ResearchPlanContext,
  CreateResearchPlan,
  injectResearchPlanService,
} from '../plan/common/research-plan';
import { User } from 'src/app/user/common/user';
import { Campus } from 'src/app/uni/campus/common/campus';

const melCampusFixture = new Campus({
  id: uuidv4(),
  code: 'MEL',
  name: 'Melbourne',
  createdAt: new Date(),
  updatedAt: new Date()
});

const experimentalPlanCreateFixture: Partial<CreateResearchPlan> = {
  title: 'The importance of being earnest',
  description: 'Behave earnestly, then deceptively and observe changes.',
  funding: 'Grant',
  researcher: new User({
    id: uuidv4(),
    email: 'help@me',
    name: 'Help me',
    baseCampus: melCampusFixture,
    disciplines: new Set([ 'ict' ]),
    roles: new Set(),
    createdAt: new Date(),
    updatedAt: new Date()
  }),
  coordinator: new User({
    id: uuidv4(),
    email: 'a@technician',
    name: 'a technician',
    baseCampus: melCampusFixture,
    disciplines: new Set([ 'electrical' ]),
    roles: new Set(),
    createdAt: new Date(),
    updatedAt: new Date()
  }),
};

@Component({
  selector: 'lab-experimental-plan-create-page',
  template: `
    <h1>Create experimental plan</h1>

    <research-plan-form (save)="onSave($event)" />
  `,
  styles: [
    `
      .form-controls {
        display: flex;
        justify-content: right;
      }
    `,
  ],
  providers: [ ResearchPlanContext ],
})
export class ResearchPlanCreatePage {
  readonly _cdRef = inject(ChangeDetectorRef);

  readonly _router = inject(Router);
  readonly _activatedRoute = inject(ActivatedRoute);

  readonly plans = injectResearchPlanService();
  readonly _context: ResearchPlanContext = inject(ResearchPlanContext);


  async onSave(patch: CreateResearchPlan) {
    const created = await firstValueFrom(this.plans.create(patch));
    await this._router.navigate([ 'research', 'plans', created.id ]);
  }
}
