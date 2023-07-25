import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LabRequestFormComponent } from "./lab-request-form.component";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ProjectLocationFormComponent } from "../project-location-form/project-location-form.component";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { SoftwareResourceFormComponent } from "../software-resource-form/software-resource-form.component";
import { EquipmentResourceFormComponent } from "../equipment-resource-form/equipment-resource-form.component";
import { ConsumableResourceFormComponent } from "../consumable-resource-form/consumable-resource-form.component";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,

        ConsumableResourceFormComponent,
        EquipmentResourceFormComponent,
        ProjectLocationFormComponent,
        SoftwareResourceFormComponent,
    ],
    declarations: [
        LabRequestFormComponent
    ],
    exports: [
        LabRequestFormComponent
    ]

})
export class LabRequestFormModule {}