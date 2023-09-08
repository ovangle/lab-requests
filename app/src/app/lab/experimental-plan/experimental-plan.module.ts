import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ExperimentalPlanIndexPage } from "./experimental-plan-index.page";
import { ExperimentalPlanDetailPage } from "./detail-page/experimental-plan-detail.page";
import { resourceFormRoutes } from "../work-unit/resources/resource-form-routing";
import { ServiceResourceFormComponent } from "../work-unit/resources/service/service-resource-form.component";
import { SoftwareResourceFormComponent } from "../work-unit/resources/software/software-resource-form.component";
import { ExperimentalPlanDetailFormOutlet } from "./detail-page/experimental-plan-detail-form-outlet.component";
import { WorkUnitResourceFormOutlet } from "../work-unit/resource-form-host.component";
import { EquipmentLeaseFormComponent } from "../work-unit/resources/equipment/equipment-lease-form.component";
import { InputMaterialResourceFormComponent } from "../work-unit/resources/material/input/input-material-resource-form.component";
import { OutputMaterialResourceFormComponent } from "../work-unit/resources/material/output/output-material-resource-form.component";


const EXPERIMENTAL_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: ExperimentalPlanIndexPage,
    },
    {
        path: ':experimental_plan_id',
        component: ExperimentalPlanDetailPage, 
        loadChildren: () => import('../work-unit/work-unit.feature').then(
            module => module.WorkUnitsModule
        )
    },
    {
        path: 'work-units',
        loadChildren: () => import('../work-unit/work-unit.feature').then(
            module => module.WorkUnitsModule
        )
    },
    {
        path: 'forms',
        outlet: 'forms',
        component: ExperimentalPlanDetailFormOutlet,
        children: [
            {
                path: 'work_units/:work_unit_id',
                component: WorkUnitResourceFormOutlet,
                children: [
                    ...resourceFormRoutes('equipment', EquipmentLeaseFormComponent),
                    ...resourceFormRoutes('service', ServiceResourceFormComponent),
                    ...resourceFormRoutes('software', SoftwareResourceFormComponent),
                    ...resourceFormRoutes('input-material', InputMaterialResourceFormComponent),
                    ...resourceFormRoutes('output-material', OutputMaterialResourceFormComponent)
                ]
            }
        ]
    }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EXPERIMENTAL_PLAN_ROUTES)
    ],
    exports: [
        RouterModule
    ]
})
export class ExperimentalPlanModule {}

