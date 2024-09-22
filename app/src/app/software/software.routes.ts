import { Routes } from "@angular/router";


export const SOFTWARE_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./_feature/software-index.page')
            .then(module => module.SoftwareIndexPage)
    },
    {
        path: ':software',
        loadComponent: () => import('./_feature/software-detail.page')
            .then(module => module.SoftwareDetailPage),
        children: [
            {
                path: 'installations',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: async () => {
                            const m = await import('./_feature/software-detail--installation-index.page');
                            return m.SoftwareDetail__InstallationIndex;
                        }
                    },
                    {
                        path: ':software_installation',
                        pathMatch: 'full',
                        loadComponent: async () => {
                            const m = await import('./_feature/software-detail--installation-detail.page');
                            return m.SoftwareDetail__InstallationDetail;
                        }
                    }
                ]
            }
        ]
    }
]

export const SOFTWARE_FORM_ROUTES: Routes = [
    {
        path: 'create-software',
        loadComponent: async () => {
            const m = await import('./_forms/declare-software.form');
            return m.DeclareSoftwareForm;
        }
    },
];