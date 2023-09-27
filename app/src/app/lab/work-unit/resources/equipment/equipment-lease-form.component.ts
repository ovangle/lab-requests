import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { EquipmentLease, EquipmentLeaseForm, equipmentLeaseForm } from "./equipment-lease";
import { defer, filter, map, startWith } from "rxjs";
import { EquipmentSearchComponent } from "src/app/lab/equipment/equipment-search.component";
import { ResourceFormService } from "../../resource/resource-form.service";
import { Equipment } from "src/app/lab/equipment/equipment";
import { MatCheckboxModule } from "@angular/material/checkbox";


@Component({
    selector: 'lab-equipment-lease-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,

        EquipmentSearchComponent
    ],
    template: `
    <form [formGroup]="form">
        <lab-equipment-search formControlName="equipment">
            <mat-label>Equipment</mat-label>
        </lab-equipment-search>

        <ng-container *ngIf="selectedEquipment$ | async as equipment">
            <mat-checkbox formControlName="isTrainingCompleted">
                I have completed the following required training for this device
            </mat-checkbox>

            <mat-checkbox formControlName="requiresAssistance">
                I require additional assistance using this equipment
            </mat-checkbox>
        </ng-container>
    </form>
    `,
})
export class EquipmentLeaseFormComponent {
    readonly formService = inject(ResourceFormService<EquipmentLease, EquipmentLeaseForm>);

    get form() {
        return this.formService.form;
    }

    get equipmentControl(): FormControl<Equipment | string | null> {
        return this.form.controls.equipment;
    }

    readonly selectedEquipment$ = defer(
        () => this.equipmentControl.valueChanges.pipe(
            startWith(this.equipmentControl.value),
            map((value) => {
                console.log('selected equipment', value);
                if (!this.equipmentControl.valid) {
                    return null;
                }
                return value; 
            })
        )
    );
}