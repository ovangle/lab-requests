import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";


@Component({
    selector: 'common-file-input',
    standalone: true,
    imports: [
        CommonModule,
        MatFormFieldModule
    ],
    template: `
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: CommonFileInputComponent
        }
    ]
})
export class CommonFileInputComponent implements ControlValueAccessor {


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