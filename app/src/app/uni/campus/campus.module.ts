import { NgModule } from "@angular/core";
import { CampusSelectComponent, CampusSelectLabelComponent } from "./campus-select.component";
import { CommonModule } from "@angular/common";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        SelectOtherDescriptionComponent
    ],
    declarations: [
        CampusSelectComponent,
        CampusSelectLabelComponent
    ],
    exports: [
        CampusSelectComponent,
        CampusSelectLabelComponent
    ]

})
export class CampusModule {}