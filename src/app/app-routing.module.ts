import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ExperimentalPlanFormComponent } from './lab/experimental-plan/experimental-plan-form.component';
import { ExperimentalPlanFormModule } from './lab/experimental-plan/experimental-plan-form.module';
import { AuthRedirectPageComponent } from './oauth/auth-redirect-page.component';
import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';
import { IotDeviceCreateFormComponent } from './iot/iot-device-create-form.component';
import { SoftwareResourceFormComponent } from './lab/resources/software/software-resource-form.component';
import { EquipmentResourceFormComponent } from './lab/resources/equipment/equipment-resource-form.component';
import { InputMaterialResourceFormComponent } from './lab/resources/material/input/input-material-resource-form.component';
import { resourceFormRoutes } from './lab/resources/resource-form-routing';
import { OutputMaterialResourceFormComponent } from './lab/resources/material/output/output-material-resource-form.component';
import { WorkUnitFormComponent, workUnitFormRoutes } from './lab/experimental-plan/work-unit/work-unit-form.component';

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
    path: 'lab-requests',
    children: [
      {
        path: '',
        redirectTo: 'experimental-plan',
        pathMatch: 'full'
      },
      {
        path: 'experimental-plan',
        component: ExperimentalPlanFormComponent,
        children: [
          ...workUnitFormRoutes(),
          ...resourceFormRoutes('software', SoftwareResourceFormComponent),
          ...resourceFormRoutes('equipment', EquipmentResourceFormComponent),
          ...resourceFormRoutes('input-material', InputMaterialResourceFormComponent),
          ...resourceFormRoutes('output-material', OutputMaterialResourceFormComponent)
        ]
      },
    ]
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes /*, {enableTracing: true} */),
    ExperimentalPlanFormModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
