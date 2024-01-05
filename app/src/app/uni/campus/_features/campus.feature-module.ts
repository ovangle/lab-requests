import { RouterModule, Routes } from '@angular/router';
import { CampusCreatePage } from './campus-create.page';
import { NgModule } from '@angular/core';

const campusRoutes: Routes = [
  {
    path: 'create',
    component: CampusCreatePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(campusRoutes)],
})
export class CampusFeature {}
