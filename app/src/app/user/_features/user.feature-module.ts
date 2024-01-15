import { Injectable, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserHomePage } from './user-home.page';
import { CommonModule } from '@angular/common';
import { AlterPasswordPage } from './alter-password.page';
import { AlterPasswordFormComponent } from '../common/alter-password-form.component';
import { LabListComponent } from 'src/app/lab/lab-list.component';
import { ResearchPlanListComponent } from 'src/app/research/plan/common/research-plan-list.component';

const USER_ROUTES: Routes = [
  {
    path: 'home',
    component: UserHomePage,
  },
  {
    path: 'alter-password',
    component: AlterPasswordPage,
  },
  {
    path: 'login',
    redirectTo: '/oauth/login',
  },
  {
    path: 'logout',
    redirectTo: '/oauth/logout',
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(USER_ROUTES),

    AlterPasswordFormComponent,
    LabListComponent,
    ResearchPlanListComponent,
  ],
  declarations: [UserHomePage, AlterPasswordPage],
})
export class UserFeatureModule { }
