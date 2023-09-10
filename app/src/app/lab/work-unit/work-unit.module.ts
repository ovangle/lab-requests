import { RouterModule, Routes } from "@angular/router";

import {WorkUnitIndexPage} from './work-unit-index.page';
import {WorkUnitDetailPage} from './work-unit-detail.page';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WorkUnitModelService } from "./work-unit";
import { RESOURCE_ROUTES } from "./resources/resource-routes";
import { WorkUnitResourceFormOutlet } from "./work-unit-resource-form-outlet.component";

const WORK_UNIT_FROM_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: WorkUnitIndexPage,
    },
    {
        path: ':work_unit_index',
        outlet: 'form',
        component: WorkUnitResourceFormOutlet,
        children: RESOURCE_ROUTES       
    },
    {
        path: ':work_unit_index',
        component: WorkUnitDetailPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(WORK_UNIT_FROM_PLAN_ROUTES)
    ],
    providers: [
        WorkUnitModelService
    ],
    exports: [
        RouterModule
    ]
})
export class FromPlanWorkUnitModule {}


const WORK_UNIT_GLOBAL_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: WorkUnitIndexPage
    },
    {
        path: ':work_unit_id',
        component: WorkUnitDetailPage
    }
]