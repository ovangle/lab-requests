import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { LabTypeSelectComponent, LabTypeSelectLabelComponent, LabTypeSelectOptionComponent } from "./lab-type-select.component";

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatSelectModule
    ],
    declarations: [
        LabTypeSelectComponent,
        LabTypeSelectOptionComponent,
        LabTypeSelectLabelComponent 
    ],
    exports: [
        LabTypeSelectComponent,
        LabTypeSelectLabelComponent 
    ]
})
export class DisciplineSelectModule {

}p