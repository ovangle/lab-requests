import { Component, EventEmitter, Output, computed, inject, input } from "@angular/core";
import { ControlContainer, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { AbstractLabProvisionCreateFormComponent, LabProvisionCreateFormGroup, labProvisionCreateFormGroup, labProvisionCreateRequestFromFormValue } from "src/app/lab/common/provisionable/abstract-lab-provision-create-form.component";
import { ResearchFunding } from "src/app/research/funding/research-funding";
import { EquipmentProvision, EquipmentProvisionService, NewEquipmentRequest } from "./equipment-provision";
import { ModelRef, isModelRef } from "src/app/common/model/model";
import { EquipmentInstallation, EquipmentInstallationCreateRequest, EquipmentInstallationParams, EquipmentInstallationService } from "../installation/equipment-installation";
import { NEVER, firstValueFrom, switchMap } from "rxjs";
import { MatFormField, MatFormFieldModule } from "@angular/material/form-field";
import { toObservable } from "@angular/core/rxjs-interop";
import { QauntityInputComponent } from "src/app/common/measurement/common-quantity-input.component";
import { MatInput } from "@angular/material/input";

export type NewEquipmentFormGroup = LabProvisionCreateFormGroup<{

}>;

function isNewEquipmentFormGroup(obj: unknown): obj is NewEquipmentFormGroup {
    return obj instanceof FormGroup;
}

export function newEquipmentFormGroup(): NewEquipmentFormGroup {
    return labProvisionCreateFormGroup(
        {},
        {
            defaultQuantityRequired: [ 1, 'item' ]
        }
    );
}

export function newEquipmentRequestFromFormValue(
    target: ModelRef<EquipmentInstallation> | EquipmentInstallationCreateRequest,
    value: NewEquipmentFormGroup[ 'value' ]
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
        MatFormFieldModule,
        MatIcon,
        MatInput,

        QauntityInputComponent
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()">
        <common-quantity-input formControlName="quantityRequired"
                               unit="item"
                               required> 
            <div #controlLabel>{{isExistingInstallation() ? 'Additional quantity': 'Quantity'}} required</div>

            @if (quantityRequiredErrors && quantityRequiredErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </common-quantity-input>

        <mat-form-field>
            <mat-label>Reason</mat-label>

            <input matInput type="text" formControlName="note" />
        </mat-form-field>

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

    readonly equipmentInstallation = computed(() => this.target);
    readonly isExistingInstallation = computed(() => isModelRef(this.equipmentInstallation()));

    _equipmentInstallationService = inject(EquipmentInstallationService);
    readonly installation$ = toObservable(this.equipmentInstallation).pipe(
        switchMap(installation => {
            if (isModelRef(installation)) {

            }
            return NEVER;
        })
    )

}