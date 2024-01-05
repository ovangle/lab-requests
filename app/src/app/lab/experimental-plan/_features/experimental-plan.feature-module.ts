import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatTabsModule } from "@angular/material/tabs";
import { MatListModule } from "@angular/material/list";

import { ExperimentalPlanFormComponent } from "../experimental-plan-form.component";
import { ExperimentalPlanInfoComponent } from "../experimental-plan-info.component";

import { ExperimentalPlanIndexPage } from "./experimental-plan-index.page";
import { ExperimentalPlanDetailPage } from "./experimental-plan-detail.page";
import { ExperimentalPlanCreatePage } from "./experimental-plan-create.page";
import { ExperimentalPlanContext } from "../common/experimental-plan";

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
        path: ':experimental_plan_id',
        component: ExperimentalPlanDetailPage,
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'work-units/0'
            },
            {
                path: 'work-units',
                loadChildren: () => import('src/app/lab/work-unit/_features/work-unit/work-unit.feature-module').then(
                    module => module.FromPlanWorkUnitModule
                )
            },
            {
                path: 'work-units',
                outlet: 'form',
                loadChildren: () => import('src/app/lab/work-unit/_features/work-unit-forms/work-unit-forms.feature-module').then(
                    module => module.WorkUnitFormsFeatureModule
                )
            }
        ]
    },

];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EXPERIMENTAL_PLAN_ROUTES),

        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatListModule,
        MatTabsModule,

        ExperimentalPlanFormComponent,
        ExperimentalPlanInfoComponent,
    ],
    declarations: [
        ExperimentalPlanCreatePage,
        ExperimentalPlanDetailPage,
        ExperimentalPlanIndexPage,
    ],
    providers: [
        ExperimentalPlanContext
    ],
    exports: [ RouterModule ]
})
export class ExperimentalPlanFeatureModule { }

