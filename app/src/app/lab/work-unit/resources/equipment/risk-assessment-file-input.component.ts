import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CommonFileInputComponent } from "src/app/common/file/file-input.component";
import { Equipment } from "../../../equipment/equipment";
import { NgxMatFileInputModule } from "@angular-material-components/file-input";


@Component({
    selector: 'lab-equipment-risk-assessment-file-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,

        CommonFileInputComponent,
        NgxMatFileInputModule
    ],
    template: `
    <mat-form-field>
        <mat-label>Risk assessment form</mat-label>
    
        <ngx-mat-file-input [formControl]="_control" />
    </mat-form-field>
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: EquipmentRiskAssessmentFileInputComponent
        }
    ]
})
export class EquipmentRiskAssessmentFileInputComponent implements ControlValueAccessor {
    @Input({required: true})
    container_id: string;

    _control = new FormControl<any | null>(null);

    writeValue(obj: any): void {
        throw new Error("Method not implemented.");
    }
    registerOnChange(fn: any): void {
        throw new Error("Method not implemented.");
    }
    registerOnTouched(fn: any): void {
        throw new Error("Method not implemented.");
    }
    setDisabledState?(isDisabled: boolean): void {
        throw new Error("Method not implemented.");
    }
}