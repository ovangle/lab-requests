import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./equipment-index.page')
      .then(module => module.EquipmentIndexPage),
  },
  {
    path: 'create',
    loadComponent: () => import('./equipment-create.page')
      .then(module => module.EquipmentCreatePage),
  },
  {
    path: ':equipment_id',
    loadComponent: () => import('./equipment-detail.page')
      .then(module => module.EquipmentDetailPage)
  },
];
