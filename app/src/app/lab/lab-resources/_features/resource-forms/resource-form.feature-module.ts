import { NgModule } from '@angular/core';
import { WorkUnitResourceFormPage } from './resource-form.page';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ResourceFormTitleComponent } from 'src/app/lab/lab-resource/common/resource-form-title.component';
import { ALL_RESOURCE_TYPES } from 'src/app/lab/lab-resource/resource-type';
import { EquipmentLeaseFormComponent } from '../../equipment-lease/equipment-lease-form.component';
import { InputMaterialResourceFormComponent } from '../../input-material/input-material-resource-form.component';
import { OutputMaterialResourceFormComponent } from '../../output-material/output-material-resource-form.component';
import { SoftwareResourceFormComponent } from '../../software-lease/software-resource-form.component';

const RESOURCE_FORM_ROUTES: Routes = ALL_RESOURCE_TYPES.flatMap(
  (resourceType) => [
    {
      path: resourceType + '/:resource_index',
      component: WorkUnitResourceFormPage,
      data: { resourceType },
    },
  ],
);

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(RESOURCE_FORM_ROUTES),

    ResourceFormTitleComponent,

    EquipmentLeaseFormComponent,
    SoftwareResourceFormComponent,

    InputMaterialResourceFormComponent,
    OutputMaterialResourceFormComponent,
  ],
  declarations: [WorkUnitResourceFormPage],
})
export class WorkUnitResourceFormsFeatureModule {}
