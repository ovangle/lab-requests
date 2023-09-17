import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { LabDashboardPage } from "./lab-dashboard.page";
import { MatListModule } from "@angular/material/list";
import { MatButtonModule } from "@angular/material/button";


const LAB_ROUTES: Routes = [
    {
        path: '',
        component: LabDashboardPage,
        children: [
            {
                path: 'equipments',
                loadChildren: () => import('../equipment/_features/equipment.feature-module').then(
                    module => module.EquipmentFeatureModule
                )
            },
            {
                path: 'experimental-plans',
                loadChildren: () => import('../experimental-plan/_features/experimental-plan.feature-module').then(
                    module => module.ExperimentalPlanFeatureModule
                )
            }
        ]
    }

]

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(LAB_ROUTES),

        MatButtonModule,
        MatListModule,
    ],
    declarations: [
        LabDashboardPage
    ]
})
export class LabFeatureModule { }