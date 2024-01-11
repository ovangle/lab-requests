import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LabDashboardPage } from './lab-dashboard.page';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { LabHomePage } from './lab-home.page';
import { MatIconModule } from '@angular/material/icon';
import { LabProfilePage } from './lab-profile.page';

const LAB_ROUTES: Routes = [
  {
    path: '',
    component: LabDashboardPage,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LabHomePage,
      },
      {
        path: 'equipments',
        loadChildren: () =>
          import('../equipment/_features/equipment.feature-module').then(
            (module) => module.EquipmentFeatureModule,
          ),
      },
      {
        path: ':lab_id',
        component: LabProfilePage,
      },
    ],
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(LAB_ROUTES),

    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  declarations: [LabDashboardPage, LabHomePage, LabProfilePage],
})
export class LabFeatureModule {}
