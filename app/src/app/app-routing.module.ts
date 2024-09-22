import { Injectable, NgModule, inject } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import {
  publicPageGuard,
  requiresAuthorizationGuard,
} from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { OauthFeatureModule } from './oauth/_features/oauth.feature-module';

const routes: Routes = [
  {
    path: '',
    canActivate: [requiresAuthorizationGuard],
    children: [
      {
        path: 'lab',
        loadChildren: () =>
          import('./lab/lab.routes').then(
            (module) => module.LAB_ROUTES,
          ),
      },
      {
        path: 'equipment',
        outlet: 'default',
        loadChildren: async () => {
          const module = await import('./equipment/equipment.routes');
          return module.EQUIPMENT_ROUTES;
        }
      },
      {
        path: 'equipment',
        outlet: 'form',
        loadChildren: async () => {
          const module = await import('./equipment/equipment.routes');
          return module.EQUIPMENT_FORM_ROUTES;
        }
      },
      {
        path: 'software',
        outlet: 'default',
        loadChildren: async () => {
          const module = await import('./software/software.routes')
          return module.SOFTWARE_ROUTES
        }
      },
      {
        path: 'software',
        outlet: 'form',
        loadChildren: async () => {
          const m = await import('./software/software.routes');
          return m.SOFTWARE_FORM_ROUTES;
        }
      },
      {
        path: 'research',
        outlet: 'default',
        loadChildren: async () => {
          const module = await import('./research/research.routes');
          return module.RESEARCH_ROUTES
        }
      },
      {
        path: 'research',
        outlet: 'form',
        loadChildren: async () => {
          const module = await import('./research/research.routes');
          return module.RESEARCH_FORM_ROUTES;
        }
      },
      {
        path: 'user',
        loadChildren: async () => {
          const module = await import('./user/_features/user/user-routes');
          return module.USER_ROUTES;
        }
      },
    ]
  },
  {
    path: 'oauth',
    loadChildren: () => OauthFeatureModule,
  },
  {
    path: 'create-user',
    loadComponent: async () => {
      const module = await import('./user/_features/temporary-user/temporary-user-redirect.page');
      return module.TemporaryUserRedirectPage;
    }
  },
  {
    path: 'public',
    component: PublicPageComponent,
    canActivate: [publicPageGuard],
  },
  {
    path: 'uni/campuses',
    loadChildren: async () => {
      const module = await import('./uni/campus/_features/campus.feature-module');
      return module.CampusFeature;
    }
  },
  {
    path: 'components',
    children: [
      {
        path: 'lab-storage-type-select',
        loadComponent: async () => {
          const module = await import('./lab/storage/lab-storage-type-select.example');
          return module.LabStorageLikeSelectExample;
        }
      }

    ]

  }

];


@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: false })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
