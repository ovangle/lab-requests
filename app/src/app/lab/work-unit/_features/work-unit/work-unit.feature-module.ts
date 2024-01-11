import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WorkUnitCreatePage } from './work-unit-create.page';
import { WorkUnitDetailPage } from './work-unit-detail.page';
import { WorkUnitIndexPage } from './work-unit-index.page';
import { CommonModule } from '@angular/common';
import { WorkUnitBaseInfoComponent } from '../../base-info/work-unit-base-info.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WorkUnitDurationInfoComponent } from '../../duration/work-unit-duration-info.component';
import {
  WorkUnitContext,
  WorkUnitResourceContainerContext,
} from '../../common/work-unit';
import { WorkUnitFormComponent } from '../../common/work-unit-form.component';
import { WorkUnitResourceInfo } from 'src/app/lab/lab-resource/resource-card.component';

const WORK_UNIT_FROM_PLAN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: WorkUnitIndexPage,
  },
  {
    path: 'create',
    pathMatch: 'full',
    component: WorkUnitCreatePage,
  },
  {
    path: ':work_unit_index',
    component: WorkUnitDetailPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(WORK_UNIT_FROM_PLAN_ROUTES),

    MatButtonModule,
    MatIconModule,

    WorkUnitBaseInfoComponent,
    WorkUnitDurationInfoComponent,
    WorkUnitFormComponent,

    WorkUnitResourceInfo,
  ],
  declarations: [WorkUnitCreatePage, WorkUnitDetailPage, WorkUnitIndexPage],
})
export class FromPlanWorkUnitModule {}
