import { Routes } from '@angular/router';


export const RESEARCH_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./_features/research-plan-index.page')
      .then(module => module.ResearchPlanIndexPage)
  },
  {
    path: 'create',
    loadComponent: () => import('./_features/research-plan-create.page')
      .then(module => module.ResearchPlanCreatePage)
  },
  {
    path: ':plan_id',
    loadComponent: () => import('./_features/research-plan-detail.page')
      .then(module => module.ResearchPlanDetailPage),
    children: [
      {
        path: '',
        loadComponent: () => import('./_features/research-plan-detail--tasks.page')
          .then(module => module.ResearchPlanDetail__TasksPage)
      },
      {
        path: 'requirements',
        loadComponent: () => import('./_features/research-plan-detail--requirements.page')
          .then(module => module.ResearchPlanDetail__RequirementsPage)
      }
    ]
  },
];

export const RESEARCH_FORM_ROUTES: Routes = [];