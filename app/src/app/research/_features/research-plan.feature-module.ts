import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';

import { ResearchPlanFormComponent } from '../plan/common/research-plan-form.component';
import { ResearchPlanInfoComponent } from '../plan/common/research-plan-info.component';

import { ResearchPlanIndexPage } from './research-plan-index.page';
import { ResearchPlanDetailPage } from './research-plan-detail.page';
import { ResearchPlanCreatePage } from './research-plan-create.page';
import { ResearchPlanContext } from '../plan/common/research-plan';

const PLAN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: ResearchPlanIndexPage,
  },
  {
    path: 'create',
    component: ResearchPlanCreatePage,
  },
  {
    path: ':plan_id',
    component: ResearchPlanDetailPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'work-units/0',
      },
      {
        path: 'work-units',
        loadChildren: () =>
          import(
            'src/app/lab/work-unit/_features/work-unit/work-unit.feature-module'
          ).then((module) => module.FromPlanWorkUnitModule),
      },
      {
        path: 'work-units',
        outlet: 'form',
        loadChildren: () =>
          import(
            'src/app/lab/work-unit/_features/work-unit-forms/work-unit-forms.feature-module'
          ).then((module) => module.WorkUnitFormsFeatureModule),
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(PLAN_ROUTES),

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,

    ResearchPlanFormComponent,
    ResearchPlanInfoComponent,
  ],
  declarations: [
    ResearchPlanCreatePage,
    ResearchPlanDetailPage,
    ResearchPlanIndexPage,
  ],
  providers: [ResearchPlanContext],
  exports: [RouterModule],
})
export class ExperimentalPlanFeatureModule {}
