import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LabRequestFormComponent } from './lab-request-form/lab-request-form.component';
import { LabRequestFormModule } from './lab-request-form/lab-request-form.module';
import { AuthRedirectPageComponent } from './oauth/auth-redirect-page.component';
import { requiresAuthorizationGuard } from './utils/router-utils';
import { PublicPageComponent } from './public-page/public-page.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [requiresAuthorizationGuard],
    children: [
      {
        path: 'lab-requests',
        children: [
          {
            path: 'form',
            component: LabRequestFormComponent
          }
        ]
      },
      {
        path: 'iot-device',
        children: [
          {
            path: 'create',
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
    path: '',
    component: PublicPageComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    LabRequestFormModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
