import { Routes } from '@angular/router';

export const EQUIPMENT_FORM_ROUTES: Routes = [
  {
    path: 'create-equipment',
    loadComponent: async () => {
      const m = await import('./create-equipment.form')
      return m.EquipmentCreateFormPage;
    }
  },
  {
    path: 'equipment-installation',
    children: [
      {
        path: '',
        loadComponent: async () => {
          const m = await import('./create-equipment-installation.form');
          return m.CreateEquipmentInstallationFormPage;
        }
      },
      {
        path: ':installation_id',
        loadComponent: async () => {
          const m = await import('./update-equipment-installation.form');
          return m.UpdateEquipmentInstallationFormPage;
        }
      }
    ]
  },
  {
    path: 'create-equipment-lease',
    children: [
      {
        path: '',
        loadComponent: async () => {
          const m = await import('./create-equipment-lease.form')
          return m.EquipmentLeaseFormPage;
        }
      },
      {
        path: ':lease_id',
        loadComponent: async () => {
          const m = await import('./create-equipment-lease.form');
          return m.EquipmentLeaseFormPage;
        }
      }
    ]
  },
  {
    path: 'review-equipment-lease/:lease_id',
    loadComponent: async () => {
      const m = await import('../_features/equipment-lease-detail.page');
      return m.EquipmentLeaseDetailPage;
    }
  }
];