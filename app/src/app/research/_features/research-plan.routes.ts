import { Routes } from '@angular/router';

export const RESEARCH_PLAN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./research-plan-index.page')
      .then(module => module.ResearchPlanIndexPage)
  },
  {
    path: 'create',
    loadComponent: () => import('./research-plan-create.page')
      .then(module => module.ResearchPlanCreatePage)
  },
  {
    path: ':plan_id',
    loadComponent: () => import('./research-plan-detail.page')
      .then(module => module.ResearchPlanDetailPage)
    /*
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
*/
  },
];
