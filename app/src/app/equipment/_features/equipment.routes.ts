import { Routes } from "@angular/router";
import { EquipmentContext, provideEquipmentDetailRouteContext } from "../equipment-context";


export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./equipment-index.page')
      .then(module => module.EquipmentIndexPage)
  },
  {
    path: 'create',
    loadComponent: () => import('./equipment-create.page')
      .then(module => module.EquipmentCreatePage)
  },
  {
    path: ':equipment_id',
    loadComponent: () => import('./equipment-detail.page')
      .then(module => module.EquipmentDetailPage),
    providers: [
      provideEquipmentDetailRouteContext()
    ],
    children: [
      {
        path: 'update',
        loadComponent: () => import('./equipment-detail-update.page')
          .then(module => module.EquipmentDetailUpdatePage)
      },
      {
        path: 'create-provision',
        loadComponent: () => import('./equipment-detail-create-provision.page')
          .then(module => module.EquipmentDetailCreateProvisionPage)
      },
      {
        path: 'installations',
        children: [
          {
            path: ':installation_id',
            loadComponent: () => import('./equipment-detail-installation-detail.page')
              .then(module => module.EquipmentDetailInstallationDetailPage)
          }
        ]
      }
    ]
  }
];