import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipment-index.page')
      .then(module => module.EquipmentIndexPage),
  },
  {
    path: 'provision',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./equipment-provision-index.page')
          .then(module => module.EquipmentProvisionIndexPage)
      },
      {
        path: ':provisioining_id',
        loadComponent: () => import('./equipment-provision-details.page')
          .then(module => module.LabEquipmentProvisionDetailsPage)
      }
    ]
  },
];
