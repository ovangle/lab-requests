import { Routes } from '@angular/router';
import { provideResearchPlanDetailContext } from '../plan/research-plan-context';

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
      .then(module => module.ResearchPlanDetailPage),
    providers: [
      provideResearchPlanDetailContext()
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./research-plan-detail--tasks.page')
          .then(module => module.ResearchPlanDetail__TasksPage)
      },
      {
        path: 'requirements',
        loadComponent: () => import('./research-plan-detail--requirements.page')
          .then(module => module.ResearchPlanDetail__RequirementsPage)
      }
    ]
  },
];
