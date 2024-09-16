import { Routes } from "@angular/router";

export const EQUIPMENT_FORM_ROUTES: Routes = [
  {
    path: 'equipment-installation',
    children: [
      {
        path: '',
        loadComponent: async () => {
          const m = await import('./_forms/create-equipment-installation.form');
          return m.CreateEquipmentInstallationFormPage;
        }
      },
      {
        path: ':installation_id',
        loadComponent: async () => {
          const m = await import('./_forms/update-equipment-installation.form');
          return m.UpdateEquipmentInstallationFormPage;
        }
      }
    ]
  },
  {
    path: 'equipment-lease',
    children: [
      {
        path: '',
        loadComponent: async () => {
          const m = await import('./_forms/create-equipment-lease.form')
          return m.EquipmentLeaseFormPage;
        }
      },
      {
        path: ':lease_id',
        loadComponent: async () => {
          const m = await import('./_forms/create-equipment-lease.form');
          return m.EquipmentLeaseFormPage;
        }
      }
    ]
  },
];

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./_features/equipment-index.page')
      .then(module => module.EquipmentIndexPage),
    children: [
      {
        path: ':equipment_id',
        // pathMatch: 'full',
        loadComponent: () => import('./_features/equipment-detail.page')
          .then(module => module.EquipmentDetailPage),
        children: [
          {
            path: 'update',
            outlet: 'form',
            loadComponent: async () => {
              const m = await import('./_forms/update-equipment.form-page');
              return m.UpdateEquipmentFormPage;
            }
          }
        ]
      },
      {
        path: 'create',
        outlet: 'form',
        loadComponent: async () => {
          const m = await import('./_forms/create-equipment.form');
          return m.EquipmentCreateFormPage;
        }
      }
    ]
  },

];
;