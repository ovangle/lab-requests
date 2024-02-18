import { Routes } from "@angular/router";
import { EquipmentContext, provideEquipmentDetailRouteContext } from "../equipment-context";


export const EQUIPMENT_ROUTES: Routes = [
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
        path: 'create-provision',
        loadComponent: () => import('./equipment-detail-create-provision.page')
          .then(module => module.EquipmentDetailCreateProvisionPage)
      }
    ]
  }
];