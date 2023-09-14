import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WorkUnitResourceFormOutlet } from "./work-unit-resource-form-outlet.component";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { ALL_RESOURCE_TYPES } from "../../resources/common/resource";
import { WorkUnitResourceDetailsPage } from "./work-unit-resource-details.page";
import { EquipmentLeaseFormComponent } from "../../resources/equipment/equipment-lease-form.component";
import { InputMaterialResourceFormComponent } from "../../resources/material/input/input-material-resource-form.component";
import { OutputMaterialResourceFormComponent } from "../../resources/material/output/output-material-resource-form.component";
import { ServiceResourceFormComponent } from "../../resources/service/service-resource-form.component";
import { SoftwareResourceFormComponent } from "../../resources/software/software-resource-form.component";
import { ResourceContainerContext } from "../../resources/resource-container";

const RESOURCE_ROUTES: Routes = ALL_RESOURCE_TYPES.flatMap(
    (t) => [
        {
            path: t + '/:resource_index',
            component: WorkUnitResourceDetailsPage,
        }
    ],
)

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: ':work_unit_index',
                component: WorkUnitResourceFormOutlet,
                children: RESOURCE_ROUTES
            }
        ]),

        EquipmentLeaseFormComponent,
        ServiceResourceFormComponent,
        SoftwareResourceFormComponent,

        InputMaterialResourceFormComponent,
        OutputMaterialResourceFormComponent
    ],
    declarations: [
        WorkUnitResourceFormOutlet,
        WorkUnitResourceDetailsPage
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