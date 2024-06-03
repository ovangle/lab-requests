import { Component, EventEmitter, Output, inject, input } from "@angular/core";
import { ControlContainer, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { EquipmentProvision, EquipmentProvisionService, NewEquipmentRequest } from "./equipment-provision";
import { ModelRef } from "src/app/common/model/model";
import { EquipmentInstallation, EquipmentInstallationCreateRequest, EquipmentInstallationParams } from "../installation/equipment-installation";
import { firstValueFrom } from "rxjs";

export type NewEquipmentFormGroup = LabProvisionCreateFormGroup<{

}>;

function isNewEquipmentFormGroup(obj: unknown): obj is NewEquipmentFormGroup {
    return obj instanceof FormGroup;
}

export function newEquipmentFormGroup(): NewEquipmentFormGroup {
    return labProvisionCreateFormGroup(
        {},
        {
            defaultNumRequired: 1,
            defaultUnitOfMeasurement: 'unit'
        }
    );
}

export function newEquipmentRequestFromFormValue(
    target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest,
    value: NewEquipmentFormGroup['value']
): NewEquipmentRequest {
    return {
        ...labProvisionCreateRequestFromFormValue(
            'new_equipment',
            target,
            value
        )
    };
}

@Component({
    selector: 'equipment-new-equipment-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButton,
        MatIcon
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()">
        @if (isStandaloneForm) {
            <div class="form-controls">
                <button mat-button type="submit" color="success"
                        [disabled]="!form.valid">
                    <mat-icon>save</mat-icon>SAVE
                </button>
                <button mat-button (click)="form.reset()" color="warn">
                    <mat-icon>close</mat-icon>CANCEL
                </button>
            </div>
        }
    </form>
    `
})
export class NewEquipmentFormComponent
    extends AbstractLabProvisionCreateFormComponent<EquipmentProvision, NewEquipmentFormGroup, NewEquipmentRequest> {

    protected override readonly __isFormGroupInstance = isNewEquipmentFormGroup;
    protected override readonly __createStandaloneForm = newEquipmentFormGroup;
    protected override readonly __createRequestFromFormValue = newEquipmentRequestFromFormValue;
}