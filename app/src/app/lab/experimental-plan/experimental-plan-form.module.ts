import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ExperimentalPlanFormComponent } from "./experimental-plan-form.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatInputModule } from "@angular/material/input";
import { MatTabsModule } from "@angular/material/tabs";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";
import { EquipmentSchemaService } from "../resources/equipment/schema/equipment-schema";
import { ExperimentalPlanTypeSelectComponent } from "./funding-type/experimental-plan-type-select.component";
import { MatIconModule } from "@angular/material/icon";
import { CampusSearchModule } from "src/app/uni/campus/campus-search.module";
import { DisciplineSelectModule } from "src/app/uni/discipline/discipline-select.module";
import { MatCardModule } from "@angular/material/card";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,

        MatButtonModule,
        MatCardModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatTabsModule,

        CampusSearchModule,
        DisciplineSelectModule,
        ExperimentalPlanTypeSelectComponent,
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