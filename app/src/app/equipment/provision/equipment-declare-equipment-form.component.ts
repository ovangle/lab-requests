import { Component, computed, inject, input } from "@angular/core";
import { ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ModelRef } from "src/app/common/model/model";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { EquipmentInstallation, EquipmentInstallationCreateRequest } from "../installation/equipment-installation";
import { Equipment } from "../equipment";
import { DeclareEquipmentRequest, EquipmentProvision } from "./equipment-provision";
import { Observable, of } from "rxjs";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { QauntityInputComponent } from "src/app/common/measurement/common-quantity-input.component";
import { MatFormFieldModule } from "@angular/material/form-field";

export type DeclareEquipmentFormGroup = LabProvisionCreateFormGroup<{
    numInstalled: FormControl<number>;
}>;

function isDeclareEquipmentFormGroup(obj: unknown): obj is DeclareEquipmentFormGroup {
    return obj instanceof FormGroup;
}

export function declareEquipmentFormGroup(): DeclareEquipmentFormGroup {
    return labProvisionCreateFormGroup(
        {
            numInstalled: new FormControl(1, { nonNullable: true })
        },
        {
            defaultFunding: null,
            defaultQuantityRequired: [ 1, 'item' ]
        }
    );
}

export function declareEquipmentRequestFromFormGroupValue(
    target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest,
    value: DeclareEquipmentFormGroup[ 'value' ],
): DeclareEquipmentRequest {
    return {
        ...labProvisionCreateRequestFromFormValue(
            'declare_equipment',
            target,
            value
        ),
        numInstalled: value.numInstalled!
    };
}


@Component({
    selector: 'equipment-declare-equipment-form',
    standalone: true,
    imports: [
        MatButton,
        MatFormFieldModule,
        MatIcon,
        ReactiveFormsModule,

        QauntityInputComponent
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()"> 
        <common-quantity-input
            formControlName="quantityRequired"
            unit="item"
            required>
            <div #controlLabel>Number installed</div>

            @if (quantityRequiredErrors && quantityRequiredErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </common-quantity-input>

        <mat-form-field>
            <mat-label>Reason</mat-label> 

            <input matInput formControlName="note" />
        </mat-form-field>

        @if (isStandaloneForm) {
            <div class="form-controls">
                <button mat-button type="submit" color="primary"
                        [disabled]="!form.valid">
                    <mat-icon>save</mat-icon>SAVE
                </button>
                <button mat-button (click)="form.reset()" color="warn">
                    <mat-icon>close</mat-icon>RESET
                </button>
            </div>
        }
    </form>
    `
})
export class DeclareEquipmentFormComponent
    extends AbstractLabProvisionCreateFormComponent<EquipmentProvision, DeclareEquipmentFormGroup, DeclareEquipmentRequest> {

    equipment = computed(() => this.target());

    protected override readonly __createStandaloneForm = declareEquipmentFormGroup;
    protected override readonly __isFormGroupInstance = isDeclareEquipmentFormGroup;
    protected override readonly __createRequestFromFormValue = declareEquipmentRequestFromFormGroupValue;
}