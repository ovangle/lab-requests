import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ExperimentalPlanIndexPage } from "./experimental-plan-index.page";
import { ExperimentalPlanDetailPage } from "./experimental-plan-detail.page";
import { ExperimentalPlanModelService } from "./experimental-plan";
import { ExperimentalPlanCreatePage } from "./experimental-plan-create.page";
import { WORK_UNIT_FROM_PLAN_ROUTES } from "../work-unit/work-unit.module";


const EXPERIMENTAL_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: ExperimentalPlanIndexPage,
    },
    {
        path: 'create',
        component: ExperimentalPlanCreatePage
    },
    {
        path: 'work-units',
        loadChildren: () => import('../work-unit/work-unit.module').then(
            module => module.FromPlanWorkUnitModule
        )
    },
    {
        path: ':experimental_plan_id',
        component: ExperimentalPlanDetailPage, 
        loadChildren: () => import('../work-unit/work-unit.module').then(
            module => module.FromPlanWorkUnitModule
        )
    },
    
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EXPERIMENTAL_PLAN_ROUTES)
    ],
    exports: [
        RouterModule
    ],
    providers: [
        ExperimentalPlanModelService
    ]
})
export class ExperimentalPlanModule {}

