import { NgModule } from "@angular/core";
import { LabEquipmentFormComponent } from "./equipment-form.component";
import { RouterModule, Routes } from "@angular/router";
import { LabEquipmentListComponent } from "./equipment-list.component";
import { LabEquipmentPageComponent } from "./equipment-page.component";
import { LabEquipmentDetailsComponent } from "./equipment-details.component";

export const equipmentRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: LabEquipmentListComponent
    },
    {
        path: 'create',
        pathMatch: 'full',
        component: LabEquipmentFormComponent
    },
    {
        path: ':equipment',
        component: LabEquipmentPageComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                component: LabEquipmentDetailsComponent
            },
            {
                path: 'update',
                component: LabEquipmentFormComponent
            }
        ],
        
    }
]
