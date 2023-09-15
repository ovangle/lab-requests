import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WorkUnitResourceFormHostPage } from "./work-unit-resource-form-host.page";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { ALL_RESOURCE_TYPES } from "../../resources/common/resource";
import { EquipmentLeaseFormComponent } from "../../resources/equipment/equipment-lease-form.component";
import { InputMaterialResourceFormComponent } from "../../resources/material/input/input-material-resource-form.component";
import { OutputMaterialResourceFormComponent } from "../../resources/material/output/output-material-resource-form.component";
import { ServiceResourceFormComponent } from "../../resources/service/service-resource-form.component";
import { SoftwareResourceFormComponent } from "../../resources/software/software-resource-form.component";
import { ResourceContainerContext } from "../../resources/resource-container";
import { WorkUnitResourceFormPage } from "./work-unit-resource-form.page";
import { ResourceFormPageTitleComponent } from "../../resources/common/resource-form-page-title.component";

const RESOURCE_FORM_ROUTES: Routes = ALL_RESOURCE_TYPES.flatMap(
    (resourceType) => [
        {
            path: resourceType + '/:resource_index',
            component: WorkUnitResourceFormPage,
            data: { resourceType }
        }
    ],
)

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: ':work_unit_index',
                component: WorkUnitResourceFormHostPage,
                children: RESOURCE_FORM_ROUTES
            }
        ]),

        ResourceFormPageTitleComponent,
        EquipmentLeaseFormComponent,
        SoftwareResourceFormComponent,
        ServiceResourceFormComponent,
        InputMaterialResourceFormComponent,
        OutputMaterialResourceFormComponent
    ],
    declarations: [
        WorkUnitResourceFormHostPage,
        WorkUnitResourceFormPage
        
    ],
    providers: [
        WorkUnitModelService,
        WorkUnitContext,
        { 
            provide: ResourceContainerContext, 
            useClass: WorkUnitResourceContainerContext
        }
    ]
})
export class WorkUnitFormsFeatureModule {}