import { CommonModule } from "@angular/common";
import { Injectable, NgModule, inject } from "@angular/core";
import { Router, RouterModule, Routes } from "@angular/router";
import { EquipmentIndexPage } from "./equipment-index.page";
import { EquipmentCreatePage } from "./equipment-create.page";
import { EquipmentDetailPage } from "./equipment-detail.page";
import { EquipmentContext, EquipmentModelService } from "../equipment";
import { LabEquipmentListComponent } from "../equipment-list.component";
import { LabEquipmentFormComponent } from "../equipment-form.component";
import { MatButtonModule } from "@angular/material/button";
import { EquipmentInfoComponent } from "../equipment-info.component";

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
        LabEquipmentListComponent,
        EquipmentInfoComponent
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