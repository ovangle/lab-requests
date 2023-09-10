import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EquipmentIndexPage } from "./equipment-index.page";
import { EquipmentCreatePage } from "./equipment-create.page";
import { EquipmentDetailPage } from "./equipment-detail.page";
import { EquipmentModelService } from "./equipment";

const equipmentRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: EquipmentIndexPage
    },
    {
        path: 'create',
        pathMatch: 'full',
        component: EquipmentCreatePage 
    },
    {
        path: ':equipment',
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: EquipmentDetailPage
            }
        ]
    }
]

@NgModule({
    imports: [
        RouterModule.forChild(equipmentRoutes)
    ],
    exports: [
        RouterModule
    ],
    providers: [
        EquipmentModelService
    ]
})
export class EquipmentFeatureModule {}