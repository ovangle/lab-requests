import { Routes } from '@angular/router';

export const LAB_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./_features/lab-index.page')
      .then(module => module.LabIndexPage),
  },
  {
    path: ':lab_id',
    loadComponent: () => import('./_features/lab-detail.page')
      .then(module => module.LabDetailPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: async () => {
          const m = await import('./_features/lab-detail--dashboard.page')
          return m.LabDetail__Dashboard;
        }
      },
      {
        path: 'equipment',
        loadComponent: async () => {
          const m = await import('./_features/lab-detail--equipment-installation-index.page');
          return m.LabDetail__EquipmentInstallationIndex;
        }
      },
      {
        path: 'software',
        loadComponent: async () => {
          const m = await import('./_features/lab-detail--software-installation-index.page')
          return m.LabDetail__SoftwareInstallationIndex;
        }
      },
      {
        path: 'material',
        loadComponent: async () => {
          const m = await import('./_features/lab-detail--material-inventory-index.page');
          return m.LabDetail__MaterialInventoryIndex;
        }
      }
    ]
  }
];
