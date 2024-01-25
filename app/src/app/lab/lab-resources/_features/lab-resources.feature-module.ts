import { Routes } from '@angular/router';
import { ALL_RESOURCE_TYPES, ResourceType } from 'src/app/lab/lab-resource/resource-type';

export const RESOURCE_FORM_ROUTES: Routes = ALL_RESOURCE_TYPES.flatMap(
  (resourceType: ResourceType) => [
    {
      outlet: 'form',
      path: resourceType + '/:resource_id',
      loadComponent: () => import('./resource-form.page')
        .then(module => module.WorkUnitResourceFormPage),
      data: { resourceType },
    },
  ],
);
