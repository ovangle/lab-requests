import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { DisciplineSelectComponent, DisciplineSelectLabelComponent } from "./discipline-select.component";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";


@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatSelectModule
    ],
    declarations: [
        DisciplineSelectComponent,
        DisciplineSelectLabelComponent
    ],
    exports: [
        DisciplineSelectComponent,
        DisciplineSelectLabelComponent
    ]
})
export class DisciplineSelectModule {

}