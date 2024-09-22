import { TextFieldModule } from "@angular/cdk/text-field";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { QauntityInputComponent } from "src/app/common/measurement/common-quantity-input.component";
import { AbstractModelForm, ModelFormActionsComponent } from "src/app/common/model/forms/abstract-model-form.component";
import { Lab } from "src/app/lab/lab";
import { researchPurchaseOrderFormGroupFactory } from "src/app/research/budget/research-purchase-order-form.component";
import { Equipment } from "../../equipment";
import { EquipmentInstallationInfoComponent } from "../equipment-installation-info.component";

export function newEquipmentFormGroupFactory() {
    const fb = inject(FormBuilder);

    const createPurchaseOrderFormGroup = researchPurchaseOrderFormGroupFactory();

    return () => fb.group({
        numRequired: fb.control(1, { validators: [Validators.required, Validators.min(1)] }),
        purchaseOrder: createPurchaseOrderFormGroup(),
        note: fb.control<string>('', { nonNullable: true })
    });
}

export type NewEquipmentFormGroup = ReturnType<ReturnType<typeof newEquipmentFormGroupFactory>>;

@Component({
    selector: 'equipment-new-equipment-form',
    standalone: true,
    imports: [
        CommonModule,

        TextFieldModule,

        ReactiveFormsModule,
        MatFormFieldModule,
        MatInput,

        ModelFormActionsComponent,
        QauntityInputComponent,
        EquipmentInstallationInfoComponent
    ],
    template: `
    <form [formGroup]="form">
        @let i = installation();
        @if (i) {
            <equipment-installation-info [installation]="i" />
        }

        <common-quantity-input formControlName="quantityRequired"
                               unit="item"
                               required>
            <div #controlLabel>Innstances required</div>

            @if (numRequiredErrors && numRequiredErrors['required']) {
                <mat-error>A value is required</mat-error>
            }
            @if (numRequiredErrors && numRequiredErrors['min']) {
                <mat-error>At least one new equipment is required</mat-error>
            }
        </common-quantity-input>

        <mat-form-field>
            <mat-label>Reason for procurement</mat-label>
            <textarea formControlName="note" cdkTextareaAutosize></textarea>
        </mat-form-field>

        <model-form-actions />
    </form>
    `,
    providers: [
        { provide: AbstractModelForm, useExisting: NewEquipmentFormComponent }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewEquipmentFormComponent extends AbstractModelForm<NewEquipmentFormGroup> {
    equipment = input.required<Equipment>();
    lab = input.required<Lab>();

    override _createStandaloneForm = newEquipmentFormGroupFactory();

    installation = computed(() => {
        return this.equipment().getInstallation(this.lab());
    })

    currentInstallCount = computed(() => {
        const equipment = this.equipment();
        const lab = this.lab();

        const install = equipment.getInstallation(lab);
        return install?.numInstalled;
    });

    get numRequiredErrors() {
        return this.form.controls.numRequired.errors;
    }

    _onSubmit() {
        this.submit.emit(this.form.value);
    }

    _onCancel() {
        this.cancel.emit(undefined);
    }


}