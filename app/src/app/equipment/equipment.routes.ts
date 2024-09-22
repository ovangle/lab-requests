import { Routes } from "@angular/router";

export const EQUIPMENT_FORM_ROUTES: Routes = [
  {
    path: 'equipment',
    loadComponent: async () => {
      const m = await import('./_forms/equipment.form-page');
      return m.EquipmentFormPage
    }
  },
  {
    path: 'installation',
    children: [
      {
        path: 'edit',
        pathMatch: 'full',
        loadComponent: async () => {
          const m = await import('./_forms/equipment-installation.form-page');
          return m.EquipmentInstallationFormPage;
        }
      },
      {
        path: 'new',
        loadComponent: async () => {
          const m = await import('./_forms/equipment-new-equipment.form-page');
          return m.EquipmentNewEquipmentFormPage;
        }
      },
      {
        path: 'transfer',
        loadComponent: async () => {
          const m = await import('./_forms/equipment-transfer.form-page');
          return m.EquipmentTransferFormPage;
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
          const m = await import('./_forms/equipment-lease.form-page')
          return m.EquipmentLeaseFormPage;
        }
      },
      {
        path: ':lease_id',
        loadComponent: async () => {
          const m = await import('./_forms/equipment-lease.form-page');
          return m.EquipmentLeaseFormPage;
        }
      }
    ]
  },
];

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./_features/equipment-index.page')
      .then(module => module.EquipmentIndexPage),
  },
  {
    path: ':equipment',
    loadComponent: () => import('./_features/equipment-detail.page')
      .then(module => module.EquipmentDetailPage),
  },
];
