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
          import('./lab/_features/lab.routes').then(
            (module) => module.LAB_ROUTES,
          ),
      },
      {
        path: 'lab-forms',
        outlet: 'form',
        loadChildren: async () => {
          const module = await import('./lab/_features/lab.routes');
          return module.LAB_FORM_ROUTES
        }
      },
      {
        path: 'equipment',
        loadChildren: async () => {
          const module = await import('./equipment/_features/equipment.routes');
          return module.EQUIPMENT_ROUTES;
        }
      },
      {
        path: 'software',
        loadChildren: async () => {
          const module = await import('./software/_feature/software.routes')
          return module.SOFTWARE_ROUTES
        }
      },
      {
        path: 'research/plans',
        loadChildren: async () => {
          const module = await import('./research/_features/research-plan.routes');
          return module.RESEARCH_PLAN_ROUTES
        }
      },
      {
        path: 'user',
        loadChildren: async () => {
          const module = await import('./user/_features/user/user-routes');
          return module.USER_ROUTES;
        }
      },
    ],
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
