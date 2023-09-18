import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { EquipmentLease, EquipmentLeaseForm, equipmentLeaseForm } from "./equipment-lease";
import { defer, filter, map } from "rxjs";
import { EquipmentSearchComponent } from "src/app/lab/equipment/equipment-search.component";
import { ResourceFormService } from "../../resource/resource-form.service";


@Component({
    selector: 'lab-equipment-lease-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

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

            <mat-checkbox formControlName="isAssistanceRequired">
                I require additional instruction in the use of this equipment
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
    

    readonly selectedEquipment$ = defer(() => 
        this.form.controls.equipment.valueChanges.pipe(
            map((value) => {
                if (!this.form.controls.equipment.valid) {
                    return null;
                }
                return value; 
            })
        )
    );
}