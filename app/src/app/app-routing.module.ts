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
    canActivate: [ requiresAuthorizationGuard ],
    children: [
      {
        path: 'lab',
        loadChildren: () =>
          import('./lab/_features/lab.feature-module').then(
            (module) => module.LabFeatureModule,
          ),
      },
      {
        path: 'research',
        loadChildren: () =>
          import('./research/_features/research-plan.feature-module').then(
            module => module.ResearchPlanFeatureModule
          )

      },
      {
        path: 'user',
        loadChildren: () =>
          import('./user/_features/user.feature-module').then(
            (module) => module.UserFeatureModule,
          ),
      },
    ],
  },
  {
    path: 'oauth',
    loadChildren: () => OauthFeatureModule,
  },
  {
    path: 'redirect-temporary-user',
    loadComponent: () => import('./user/_features/public/temporary-user-redirect.page')
      .then(module => module.TemporaryUserRedirectPage)
  },
  {
    path: 'public',
    component: PublicPageComponent,
    canActivate: [ publicPageGuard ],
  },
  {
    path: 'uni/campuses',
    loadChildren: () =>
      import('./uni/campus/_features/campus.feature-module').then(
        (module) => module.CampusFeature,
      ),
  },
];

@Injectable({ providedIn: 'root' })
export class AppRoutes {
  readonly public = '/public';

  readonly oauth = '/oauth';
  readonly user = '/user';
  readonly lab = '/lab';
}

@NgModule({
  imports: [ RouterModule.forRoot(routes, { enableTracing: false }) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule { }
