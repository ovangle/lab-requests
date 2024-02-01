import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipment-index.page')
      .then(module => module.EquipmentIndexPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./equipment-create.page')
      .then(module => module.EquipmentCreatePage),
  },

  {
    path: 'provisioining',
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./equipment-provision-index.page')
          .then(module => module.EquipmentProvisionIndexPage)
      },
      {
        path: 'request',
        loadComponent: () => import('./equipment-provision-request.page')
          .then(module => module.EquipmentRequestPage)
      },
      {
        path: ':provisioining_id',
        loadComponent: () => import('./equipment-provision-details.page')
          .then(module => module.LabEquipmentProvisionDetailsPage)

      }
    ]
  },
  {
    path: ':equipment_id',
    loadComponent: () => import('./equipment-detail.page')
      .then(module => module.EquipmentDetailPage)
  },
];
