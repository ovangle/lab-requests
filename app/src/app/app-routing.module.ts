import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthRedirectPageComponent } from './oauth/auth-redirect-page.component';
import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { IotDeviceCreateFormComponent } from './iot/iot-device-create-form.component';

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
    path: 'sso-redirect',
    component: AuthRedirectPageComponent
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
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
