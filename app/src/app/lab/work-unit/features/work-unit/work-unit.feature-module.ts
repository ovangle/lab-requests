import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { WorkUnitContext, WorkUnitModelService, WorkUnitResourceContainerContext } from "../../work-unit";
import { WorkUnitCreatePage } from "./work-unit-create.page";
import { WorkUnitDetailPage } from "./work-unit-detail.page";
import { WorkUnitIndexPage } from "./work-unit-index.page";
import { CommonModule } from "@angular/common";
import { WorkUnitBaseInfoComponent } from "../../base-info/work-unit-base-info.component";
import { WorkUnitResourceCardComponent } from "../../resources/resource-card.component";
import { WorkUnitFormComponent } from "../../work-unit-form.component";
import { ResourceContainerContext } from "../../resources/resource-container";


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
        WorkUnitModelService,
        WorkUnitContext,
        {
            provide: ResourceContainerContext,
            useClass: WorkUnitResourceContainerContext
        }
    ]
})
export class FromPlanWorkUnitModule {}
