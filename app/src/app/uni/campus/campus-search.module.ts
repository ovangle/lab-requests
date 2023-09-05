import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatSelectModule } from "@angular/material/select";
import { ReactiveFormsModule } from "@angular/forms";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

import { CampusSearchComponent, CampusSearchLabelComponent, CampusSearchOptionComponent } from "./campus-search.component";
import { CampusInfoComponent } from "./campus-info.component";

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,

        CampusInfoComponent
    ],
    declarations: [
        CampusSearchComponent,
        CampusSearchOptionComponent,
        CampusSearchLabelComponent
    ],
    exports: [
        CampusSearchComponent,
        CampusSearchLabelComponent,
        CampusInfoComponent,
    ]
})
export class CampusSearchModule {}