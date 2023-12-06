import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { IotDeviceCreateFormComponent } from './iot/iot-device-create-form.component';
import { OauthFeatureModule } from './oauth/_features/oauth.feature-module';

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
      {
        path: 'lab',
        loadChildren: () => import('./lab/_features/lab.feature-module')
          .then(module => module.LabFeatureModule)
      },
      {
        path: 'user',
        loadChildren: () => import('./user/_features/user.feature-module')
          .then(module => module.UserFeatureModule)
      }
    ]
  },
  {
    path: 'oauth',
    loadChildren: () => OauthFeatureModule
  },
  {
    path: 'public',
    component: PublicPageComponent
  },
  {
    path: 'uni/campuses',
    loadChildren: () => import('./uni/campus/_features/campus.feature-module')
      .then(module => module.CampusFeature)
  },
]


@NgModule({
  imports: [
    RouterModule.forRoot(routes, {enableTracing: false}),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
