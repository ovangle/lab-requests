import { NgModule } from "@angular/core";
import { WorkUnitResourceFormPage } from "./resource-form.page";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { ALL_RESOURCE_TYPES } from "../../resource-type";
import { EquipmentLeaseFormComponent } from "../../../resources/equipment/equipment-lease-form.component";
import { SoftwareResourceFormComponent } from "../../../resources/software/software-resource-form.component";
import { ServiceResourceTableComponent } from "../../../resources/task/task-resource-table.component";
import { OutputMaterialResourceFormComponent } from "../../../resources/output-material/output-material-resource-form.component";
import { InputMaterialResourceFormComponent } from "../../../resources/input-material/input-material-resource-form.component";
import { ResourceFormTitleComponent } from "../../common/resource-form-title.component";
import { TaskResourceFormComponent } from "../../../resources/task/task-resource-form.component";

const RESOURCE_FORM_ROUTES: Routes = ALL_RESOURCE_TYPES.flatMap(
    (resourceType) => [
        {
            path: resourceType + '/:resource_index',
            component: WorkUnitResourceFormPage,
            data: { resourceType }
        }
    ],
);

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(RESOURCE_FORM_ROUTES),

        ResourceFormTitleComponent,

        EquipmentLeaseFormComponent,
        SoftwareResourceFormComponent,

        TaskResourceFormComponent,
        InputMaterialResourceFormComponent,
        OutputMaterialResourceFormComponent,
    ],
    declarations: [
        WorkUnitResourceFormPage
    ]
})
export class WorkUnitResourceFormsFeatureModule { }