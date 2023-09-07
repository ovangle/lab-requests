import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ExperimentalPlanIndexPage } from "./experimental-plan-index.page";
import { ExperimentalPlanDetailPage } from "./experimental-plan-detail.page";


const EXPERIMENTAL_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: ExperimentalPlanIndexPage,
    },
    {
        path: ':experimental_plan_id',
        component: ExperimentalPlanDetailPage, 
        loadChildren: () => import('./work-unit/work-unit.feature').then(
            module => module.WorkUnitsModule
        )
    },
    {
        path: 'work-units',
        loadChildren: () => import('./work-unit/work-unit.feature').then(
            module => module.WorkUnitsModule
        )
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

