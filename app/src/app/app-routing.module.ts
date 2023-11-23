import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthRedirectPageComponent } from './oauth/_feature/oauth-redirect.page';
import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { IotDeviceCreateFormComponent } from './iot/iot-device-create-form.component';
import { OauthModule } from './oauth/_feature/oauth.feature-module';

const routes: Routes = [
  {
    path: '',
    canActivate: [requiresAuthorizationGuard],
    children: [
      {
        path: 'iot-device',
        children: [
          {
            path: 'create',
            component: IotDeviceCreateFormComponent
          }
        ]
      },
    ]
  },
  {
    path: 'oauth',
    loadChildren: () => import('./oauth/_features/oauth.feature-module')
      .then(module => module.OauthFeatureModule)
  },
  {
    path: 'public',
    component: PublicPageComponent
  },
  {
    path: 'lab',
    loadChildren: () => import('./lab/_features/lab.feature-module')
      .then(module => module.LabFeatureModule)
  },
  {
    path: 'uni/campuses',
    loadChildren: () => import('./uni/campus/_features/campus.feature-module')
      .then(module => module.CampusFeature)
  },
  {
    path: 'user',
    loadChildren: () => import('./user/_features/user.feature-module')
      .then(module => module.UserFeatureModule)
  }
]


@NgModule({
  imports: [
    RouterModule.forRoot(routes, {enableTracing: false}),
    OauthModule.forRoot('/oauth')
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
