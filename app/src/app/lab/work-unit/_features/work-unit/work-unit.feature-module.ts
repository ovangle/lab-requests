import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { WorkUnitCreatePage } from "./work-unit-create.page";
import { WorkUnitDetailPage } from "./work-unit-detail.page";
import { WorkUnitIndexPage } from "./work-unit-index.page";
import { CommonModule } from "@angular/common";
import { WorkUnitBaseInfoComponent } from "../../base-info/work-unit-base-info.component";
import { WorkUnitFormComponent } from "../../work-unit-form.component";
import { ResourceContainerContext } from "../../resource/resource-container";
import { WorkUnitResourceCardComponent } from "../../resource/resource-card.component";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";


const WORK_UNIT_FROM_PLAN_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: WorkUnitIndexPage,
    },
    {
        path: 'create',
        pathMatch: 'full',
        component: WorkUnitCreatePage,
    },
    {
        path: ':work_unit_index',
        component: WorkUnitDetailPage,
    },
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(WORK_UNIT_FROM_PLAN_ROUTES),

        MatButtonModule,
        MatIconModule,

        WorkUnitBaseInfoComponent,
        WorkUnitFormComponent,

        WorkUnitResourceCardComponent
    ],
    declarations: [
        WorkUnitCreatePage,
        WorkUnitDetailPage,
        WorkUnitIndexPage
    ],
    providers: [
        WorkUnitContext,
        {
            provide: ResourceContainerContext,
            useClass: WorkUnitResourceContainerContext
        }
    ]
})
export class FromPlanWorkUnitModule {}
