import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";

import { CampusSearchComponent, CampusSearchLabelComponent, CampusSearchOptionComponent } from "./campus-search.component";
import { CampusInfoComponent } from "./campus-info.component";
import { CampusModelService } from "./campus";

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
    ],
    providers: [
        CampusModelService
    ]
})
export class CampusSearchModule {}