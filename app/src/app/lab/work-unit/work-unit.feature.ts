import { RouterModule, Routes } from "@angular/router";

import {WorkUnitIndexPage} from './work-unit-index-page.component';
import {WorkUnitDetailPage} from './work-unit-detail-page.component';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { WorkUnitModelService } from "./work-unit";

const WORK_UNIT_FROM_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: WorkUnitIndexPage,
    },
    {
        path: ':work_unit_index',
        component: WorkUnitDetailPage,
    }
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
export class WorkUnitsModule {}
