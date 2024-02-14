import { Component, Input, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { EquipmentProvisionIndexPage } from "src/app/lab/equipment/_features/equipment-provision-index.page";
import { LabEquipmentFormComponent, equipmentForm } from "../equipment-form.component";
import { LabEquipmentProvision, LabEquipmentProvisionApprovalRequest, LabEquipmentProvisionRequest } from "./equipment-provision";
import { EquipmentContext } from "../equipment-context";
import { EquipmentPatch } from "../equipment";
import { filter, map } from "rxjs";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { CurrencyInputComponent } from "src/app/common/currency/currency-input.component";

@Component({
    selector: 'equipment-provision-approval-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,

        CurrencyInputComponent,
        LabEquipmentFormComponent,
    ],
    template: `
    <div class="equipment">
        <equipment-form [committed]="provision!.equipment" 
                        (requestCommit)="_onEquipmentPatchRequested($event)" />
    </div>

    <form [formGroup]="formGroup">
        <common-currency-input formControlName="estimatedCost">
            <mat-label>Estimated cost</mat-label>
        </common-currency-input>

        <mat-form-field>
            <mat-label>Purchase url</mat-label>
            <input matInput formControlName="purchaseUrl" />
        </mat-form-field>
    </form>
    `
})
export class ProvisionApprovalFormComponent {
    readonly formGroup = new FormGroup({
        equipment: new FormControl<EquipmentPatch | null>(null),
        estimatedCost: new FormControl<number>(0, { nonNullable: true }),
        purchaseUrl: new FormControl<string>('', { nonNullable: true })
    });

    @Input({ required: true })
    provision: LabEquipmentProvision | undefined;

    approvalRequest$ = this.formGroup.valueChanges.pipe(
        filter(() => !this.formGroup.valid),
        map(value => {
            const request: LabEquipmentProvisionApprovalRequest = {
                actualCost: value.estimatedCost || 0,
                purchaseUrl: value.purchaseUrl || ''
            };
            if (value.equipment) {
                request.equipment = value.equipment;
            }
            return request;
        })
    )

    _onEquipmentPatchRequested(patch: EquipmentPatch) {
        this.formGroup
    }
}