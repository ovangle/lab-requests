import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ExperimentalPlanFormComponent } from "./experimental-plan-form.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";
import { SoftwareResourceTableComponent } from "../resources/software/software-resource-table.component";
import { EquipmentResourceTableComponent } from "../resources/equipment/equipment-resource-table.component";
import { InputMaterialResourceTableComponent } from "../resources/material/input/input-material-resource-table.component";
import { OutputMaterialResourceTableComponent } from "../resources/material/output/output-material-resource-table.component";
import { MatCardModule } from "@angular/material/card";
import { EquipmentSchemaService } from "../resources/equipment/schema/equipment-schema";
import { ExperimentalPlanTypeSelectComponent } from "./type/experimental-plan-type-select.component";
import { CampusSelectComponent } from "./campus/campus-select.component";
import { DisciplineSelectComponent } from "./discipline/discipline-select.component";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,

        MatButtonModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,
        MatCardModule,

        ExperimentalPlanTypeSelectComponent,
        CampusSelectComponent,
        DisciplineSelectComponent,

        SoftwareResourceTableComponent,
        EquipmentResourceTableComponent,

        InputMaterialResourceTableComponent,
        OutputMaterialResourceTableComponent
    ],
    declarations: [
        ExperimentalPlanFormComponent
    ],
    providers: [
        EquipmentSchemaService
    ],
    exports: [
        ExperimentalPlanFormComponent
    ]

})
export class ExperimentalPlanFormModule {}