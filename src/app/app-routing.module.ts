import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LabRequestFormComponent } from './lab-request-form/lab-request-form.component';
import { LabRequestFormModule } from './lab-request-form/lab-request-form.module';

const routes: Routes = [
  {
    path: 'form',
    component: LabRequestFormComponent
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
