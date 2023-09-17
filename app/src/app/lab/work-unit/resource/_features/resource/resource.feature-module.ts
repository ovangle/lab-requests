import { NgModule } from "@angular/core";
import { WorkUnitResourceCardComponent } from "./resource-card.component";
import { EquipmentLeaseTableComponent } from "../../../resources/equipment/equipment-lease-table.component";
import { SoftwareResourceTableComponent } from "../../../resources/software/software-resource-table.component";
import { ServiceResourceTableComponent } from "../../../resources/service/service-resource-table.component";
import { InputMaterialResourceTableComponent } from "../../../resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "../../../resources/material/output/output-material-resource-table.component";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { MatCardModule } from "@angular/material/card";

const RESOURCE_ROUTES: Routes = [
    { 
        path: '',
        pathMatch: 'full',
        component: WorkUnitResourceCardComponent
    }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(RESOURCE_ROUTES),

        MatCardModule,

        EquipmentLeaseTableComponent,
        ServiceResourceTableComponent,
        SoftwareResourceTableComponent,
        InputMaterialResourceTableComponent,
        OutputMaterialResourceTableComponent
    ],
    declarations: [
        WorkUnitResourceCardComponent
    ]
})
export class WorkUnitResourceFeatureModule {}