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
    children: [
      {
        path: 'equipment', 
        loadChildren: () => import('./lab/equipment/equipment.feature-module')
            .then(module => module.EquipmentFeatureModule)
      },
      {
        path: 'experimental-plans',
        loadChildren: () => import('./lab/experimental-plan/experimental-plan.module')
          .then(module => module.ExperimentalPlanModule)
      }
    ]
  },
  {
    path: 'uni/campuses',
    loadChildren: () => import('./uni/campus/campus.feature-module')
      .then(module => module.CampusFeature)
  }
]


@NgModule({
  imports: [
    RouterModule.forRoot(routes /*, {enableTracing: true} */),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
