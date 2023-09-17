import { Component, Input } from "@angular/core";
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { EquipmentTrainingListFormComponent } from "./training-list-form.component";
import { CommonModule, formatNumber } from "@angular/common";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EquipmentTrainingInfoComponent } from "./training-info.component";
import { Subscription } from "rxjs";
import { disabledStateToggler } from "src/app/utils/forms/disable-state-toggler";


@Component({
    selector: 'lab-equipment-training-acknowledgement-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCheckboxModule,

        EquipmentTrainingInfoComponent
    ],
    template: `
    <lab-equipment-training-info
        [trainingDescriptions]="trainingDescriptions">
    </lab-equipment-training-info>

    <p>
        <mat-checkbox [formControl]="_checkboxControl"
                      (blur)="_onTouched()">
        </mat-checkbox>
        The researcher has completed the required competencies
    </p>
    `,
    providers: [
        { 
            provide: NG_VALUE_ACCESSOR, 
            multi: true,
            useExisting: EquipmentTrainingListFormComponent
        }
    ]
})
export class EquipmentTrainingAcknowlegementComponent implements ControlValueAccessor {
    @Input({required: true})
    trainingDescriptions: string[];

    _checkboxControl = new FormControl<boolean>(false, {nonNullable: true});
    _subscriptions: Subscription[] = [];

    ngOnDestroy() {
        this._subscriptions.forEach(s => s.unsubscribe());
    }

    writeValue(obj: any): void {
        this._checkboxControl.setValue(obj);
    }
    registerOnChange(fn: any): void {
        this._subscriptions.push(
            this._checkboxControl.valueChanges.subscribe(fn)
        );

    }
    _onTouched = () => {}
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    setDisabledState = disabledStateToggler(this._checkboxControl);
}