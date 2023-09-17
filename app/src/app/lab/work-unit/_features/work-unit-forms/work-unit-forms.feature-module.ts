import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WorkUnitResourceFormHostPage } from "./work-unit-resource-form-host.page";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { ResourceContainerContext } from "../../resource/resource-container";


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: ':work_unit_index',
                component: WorkUnitResourceFormHostPage,
                loadChildren: () => import('../../resource/_features/resource-forms/resource-form.feature-module').then(
                    module => module.WorkUnitResourceFormsFeatureModule
                )
            }
        ]),
    ],
    declarations: [
        WorkUnitResourceFormHostPage,
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