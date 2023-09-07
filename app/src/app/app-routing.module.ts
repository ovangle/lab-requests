import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExperimentalPlanFormComponent } from './lab/experimental-plan/experimental-plan-form.component';
import { ExperimentalPlanFormModule } from './lab/experimental-plan/experimental-plan-form.module';
import { AuthRedirectPageComponent } from './oauth/auth-redirect-page.component';
import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { IotDeviceCreateFormComponent } from './iot/iot-device-create-form.component';
import { SoftwareResourceFormComponent } from './lab/experimental-plan/resources/software/software-resource-form.component';
import { EquipmentLeaseFormComponent } from './lab/experimental-plan/resources/equipment/equipment-lease-form.component';
import { InputMaterialResourceFormComponent } from './lab/experimental-plan/resources/material/input/input-material-resource-form.component';
import { resourceFormRoutes } from './lab/experimental-plan/resources/resource-form-routing';
import { OutputMaterialResourceFormComponent } from './lab/experimental-plan/resources/material/output/output-material-resource-form.component';
import { WorkUnitFormComponent } from './lab/experimental-plan/work-unit/work-unit-patch-form.component';

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
    ExperimentalPlanFormModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
