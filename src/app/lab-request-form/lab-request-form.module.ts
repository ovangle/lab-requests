import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { LabRequestFormComponent } from "./lab-request-form.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ProjectLocationFormComponent } from "../project-location-form/project-location-form.component";
import { MatInputModule } from "@angular/material/input";
import { ReactiveFormsModule } from "@angular/forms";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatSlideToggleModule,

        ProjectLocationFormComponent
    ],
    declarations: [
        LabRequestFormComponent
    ],
    exports: [
        LabRequestFormComponent
    ]

})
export class LabRequestFormModule {}