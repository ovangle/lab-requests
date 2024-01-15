import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorkUnitResourceFormHostPage } from './work-unit-resource-form-host.page';
import { WorkUnitUpdateFormPage } from './work-unit-update-form.page';
import { WorkUnitFormTitleComponent } from '../../common/work-unit-form-title.component';
import {
  WorkUnitContext,
  WorkUnitResourceContainerContext,
} from '../../common/work-unit';
import { WorkUnitFormComponent } from '../../common/work-unit-form.component';
import { WorkUnitContextHostPage } from './work-unit-context-host.page';
import { ResourceContainerContext } from 'src/app/lab/lab-resource/resource-container';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: ':work_unit_index',
        component: WorkUnitContextHostPage,
        children: [
          {
            path: 'update',
            component: WorkUnitUpdateFormPage,
          },
          {
            path: '',
            component: WorkUnitResourceFormHostPage,
            loadChildren: () =>
              import(
                '../../../lab-resources/_features/lab-resources.feature-module'
              ).then((module) => module.LabResourcesFeatureModule),
          },
        ],
      },
    ]),
    WorkUnitFormComponent,
    WorkUnitFormTitleComponent,
  ],
  declarations: [
    WorkUnitContextHostPage,
    WorkUnitResourceFormHostPage,
    WorkUnitUpdateFormPage,
  ],
  providers: [
    WorkUnitContext,
    {
      provide: ResourceContainerContext,
      useClass: WorkUnitResourceContainerContext,
    },
  ],
})
export class WorkUnitFormsFeatureModule { }
