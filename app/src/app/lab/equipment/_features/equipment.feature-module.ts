import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { EquipmentIndexPage } from "./equipment-index.page";
import { EquipmentCreatePage } from "./equipment-create.page";
import { EquipmentDetailPage } from "./equipment-detail.page";
import { EquipmentContext, EquipmentModelService } from "../equipment";
import { LabEquipmentListComponent } from "../equipment-list.component";
import { LabEquipmentFormComponent } from "../equipment-form.component";
import { MatButtonModule } from "@angular/material/button";

const EQUIPMENT_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: EquipmentIndexPage
    },
    {
        path: 'create',
        component: EquipmentCreatePage
    },
    {
        path: ':equipment_id',
        component: EquipmentDetailPage
    }
]

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(EQUIPMENT_ROUTES),

        MatButtonModule,

        LabEquipmentFormComponent,
        LabEquipmentListComponent
    ],
    declarations: [
        EquipmentCreatePage,
        EquipmentDetailPage,
        EquipmentIndexPage,
    ],
    providers: [
        EquipmentModelService,
        EquipmentContext
    ]
})
export class EquipmentFeatureModule {}