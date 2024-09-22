import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { AbstractModelForm, ModelFormActionsComponent } from "src/app/common/model/forms/abstract-model-form.component";
import { Lab } from "src/app/lab/lab";
import { LabSearchComponent } from "src/app/lab/lab-search.component";
import { ResearchPurchaseOrderFormComponent, researchPurchaseOrderFormGroupFactory } from "src/app/research/budget/research-purchase-order-form.component";
import { Equipment } from "../../equipment";
import { firstValueFrom, Observable } from "rxjs";
import { MatInputModule } from "@angular/material/input";
import { EquipmentInstallation } from "../equipment-installation";
import { toObservable } from "@angular/core/rxjs-interop";
import { ResearchBudget } from "src/app/research/budget/research-budget";

export function equipmentTransferFormGroupFactory(sourceInstall: Observable<EquipmentInstallation>) {
    const fb = inject(FormBuilder);

    const createPurchaseOrderForm = researchPurchaseOrderFormGroupFactory();

    return () => fb.group({
        destination: fb.control<Lab | null>(null, {
            validators: [Validators.required]
        }),
        numTransferred: fb.control<number>(1, {
            validators: [
                Validators.required,
                Validators.min(1)
            ],
            asyncValidators: [
                async (c) => {
                    const installation = await firstValueFrom(sourceInstall);

                    if (typeof c.value === 'number' && c.value > installation.numInstalled) {
                        return {
                            max: true
                        };
                    }
                    return null;
                }
            ]
        }),
        purchase: createPurchaseOrderForm(),
    });
}

export type EquipmentTransferFormGroup = ReturnType<ReturnType<typeof equipmentTransferFormGroupFactory>>;


@Component({
    selector: 'equipment-transfer-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,

        ModelFormActionsComponent,

        LabSearchComponent,
        ResearchPurchaseOrderFormComponent
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="onFormSubmit()">

        <mat-form-field>
            @let destination = form.controls.destination;
            <mat-label>To lab</mat-label>
            <lab-search formControlName="destination" required
                        [disabledLabs]="[sourceInstallation().labId]" />

            @if (destination.errors && destination.errors['required']) {
                <mat-error>A value is required</mat-error>
            }
        </mat-form-field>

        <mat-form-field>
            <mat-label>Number to transfer</mat-label>
            <input matInput type="number" formControlName="numTransferred"/>

            @let numTransferred = form.controls.numTransferred;

            @if (numTransferred.errors && numTransferred.errors['required']) {
                <mat-error>A value is required</mat-error>
            }

            @if (numTransferred.errors && numTransferred.errors['min']) {
                <mat-error>At least one instance of the equipment must be transferred</mat-error>
            }

            @if (numTransferred.errors && numTransferred.errors['max']) {
                <mat-error>Cannot transfer more items than exist in the source lab</mat-error>
            }

        </mat-form-field>

        <research-purchase-order-form formGroupName="purchase">
            <p>
                Estimate any costs associated with transferring this equipment
                to the destination.
            </p>

        </research-purchase-order-form>



        <model-form-actions (submit)="onFormSubmit()" (cancel)="onCancel()" />
    </form>
    `,
    providers: [
        { provide: AbstractModelForm, useExisting: EquipmentTransferFormComponent }
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EquipmentTransferFormComponent extends AbstractModelForm<EquipmentTransferFormGroup> {
    budget = input.required<ResearchBudget>();
    sourceInstallation = input.required<EquipmentInstallation>();

    readonly _createStandaloneForm = equipmentTransferFormGroupFactory(
        toObservable(this.sourceInstallation)
    );

}