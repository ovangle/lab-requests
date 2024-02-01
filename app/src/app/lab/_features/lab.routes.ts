import { Routes } from '@angular/router';
import { EQUIPMENT_ROUTES } from '../equipment/_features/equipment-routes';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lab-dashboard.page').then(
      module => module.LabDashboardPage
    ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./lab-home.page').then(
          module => module.LabHomePage,
        )
      },
      {
        path: 'equipment',
        children: [
          ...EQUIPMENT_ROUTES
        ]
      },
      {
        path: ':lab_id',
        loadComponent: () =>
          import('./lab-profile.page').then(module => module.LabProfilePage),
        children: [
          {
            path: 'equipment',
            children: EQUIPMENT_ROUTES
          }
        ]
      },

    ],
  },
  {
    path: 'resources',
    loadChildren: () => import('../lab-resources/_features/lab-resources.feature-module')
      .then((module) => module.RESOURCE_FORM_ROUTES)
  },
];

export const LAB_FORM_ROUTES = [
  {
    path: 'resources',
    loadChildren: () => import('../lab-resources/_features/lab-resources.feature-module')
      .then(module => module.RESOURCE_FORM_ROUTES)
  }
]