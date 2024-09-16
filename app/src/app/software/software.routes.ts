import { Routes } from "@angular/router";
import { provideSoftwareDetailContext } from "./software-context";


export const SOFTWARE_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./_feature/software-index.page')
            .then(module => module.SoftwareIndexPage)
    },
    {
        path: ':software_id',
        loadComponent: () => import('./_feature/software-detail.page')
            .then(module => module.SoftwareDetailPage),
        providers: [
            provideSoftwareDetailContext()
        ],
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
                        path: ':installation_id',
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