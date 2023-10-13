import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { WorkUnitResourceFormHostPage } from "./work-unit-resource-form-host.page";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { ResourceContainerContext } from "../../resource/resource-container";
import { WorkUnitUpdateFormPage } from "./work-unit-update-form.page";
import { WorkUnitBaseInfoFormComponent } from "../../base-info/work-unit-base-info-form.component";


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild([
            {
                path: ':work_unit_index',
                component: WorkUnitResourceFormHostPage,
                children: [
                    {
                        path: 'update',
                        component: WorkUnitUpdateFormPage
                    },
                    {
                        path: '',
                        loadChildren: () => import('../../resource/_features/resource-forms/resource-form.feature-module').then(
                            module => module.WorkUnitResourceFormsFeatureModule
                        )
                    }
                ]
            }
        ]),
        WorkUnitBaseInfoFormComponent
    ],
    declarations: [
        WorkUnitResourceFormHostPage,
        WorkUnitUpdateFormPage
    ],
    providers: [
        WorkUnitContext,
        { 
            provide: ResourceContainerContext, 
            useClass: WorkUnitResourceContainerContext
        }
    ]
})
export class WorkUnitFormsFeatureModule {}