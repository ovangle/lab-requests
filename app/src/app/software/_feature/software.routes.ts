import { Routes } from "@angular/router";
import { provideSoftwareDetailContext } from "../software-context";


export const SOFTWARE_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./software-index.page')
            .then(module => module.SoftwareIndexPage)
    },
    {
        path: 'create',
        loadComponent: () => import('./software-create.page')
            .then(module => module.SoftwareCreatePage)
    },
    {
        path: ':software_id',
        loadComponent: () => import('./software-detail.page')
            .then(module => module.SoftwareDetailPage),
        providers: [
            provideSoftwareDetailContext()
        ],
        redirectTo: './installations',
        children: [
            {
                path: '',
                pathMatch: 'full',
                loadComponent: async () => {
                    const module = await import('./software-detail--dashboard.page');
                    return module.SoftwareDetail__DashboardPage;
                },
            },
            {
                path: 'installations',
                loadComponent: async () => {
                    const module = await import('./software-detail--installations.page')
                    return module.SoftwareDetail__InstallationsPage;
                }
            }
        ]
    }
]