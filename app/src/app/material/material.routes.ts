import { Routes } from '@angular/router';

export const MATERIAL_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: async () => {
            const m = await import('./_feature/material-index.page');
            return m.MaterialIndex;
        }
    },
    {
        path: 'create',
        pathMatch: 'full',
        loadComponent: async () => {
            const m = await import('./_feature/material-create.page');
            return m.MaterialCreate;
        }
    },
    {
        path: ':material_id',
        loadComponent: async () => {
            const m = await import('./_feature/material-detail.page');
            return m.MaterialDetail;
        },
        children: [
            {
                path: 'inventories',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: async () => {
                            const m = await import('./_feature/material-detail--inventory-index.page')
                            return m.MaterialDetail__InventoryIndex
                        }
                    },
                    {
                        path: ':inventory_id',
                        pathMatch: 'full',
                        loadComponent: async () => {
                            const m = await import('./_feature/material-detail--inventory-detail.page')
                            return m.MaterialDetail__InventoryDetail;
                        }
                    }
                ]
            }
        ]
    }
]

export const MATERIAL_FORM_ROUTES: Routes = [
    {
        path: 'input-material',
        children: [
            {
                path: 'create',
                loadComponent: async () => {
                    const m = await import('./_feature/input-material-create.page')
                    return m.InputMaterialCreate;
                },
            },
            {
                path: ':input_material_id',
                loadComponent: async () => {
                    const m = await import('./_feature/input-material-detail.page')
                    return m.InputMaterialDetail;
                }
            }
        ]
    },
    {
        path: 'output-material',
        children: [
            {
                path: 'create',
                loadComponent: async () => {
                    const m = await import('./_feature/output-material-create.page');
                    return m.OutputMaterialCreate;
                }
            },
            {
                path: ':output_material_id',
                loadComponent: async () => {
                    const m = await import('./_feature/output-material-detail.page');
                    return m.OutputMaterialDetail;
                }
            }
        ]
    }
]