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
            defaultNumRequired: 1,
            defaultUnitOfMeasurement: 'item'
        }
    );
}

export function declareEquipmentRequestFromFormGroupValue(
    target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest,
    value: DeclareEquipmentFormGroup['value'],
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
        MatIcon,
        ReactiveFormsModule
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()"> 





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