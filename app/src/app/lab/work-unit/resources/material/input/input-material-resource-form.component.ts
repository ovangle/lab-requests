import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "./input-material";
import { ResourceFormService } from "../../../resource/resource-form.service";
import { HazardClassesSelectComponent } from "../../../resource/hazardous/hazard-classes-select.component";
import { ProvisionFormComponent } from "../../../resource/provision/provision-form.component";
import { ResourceStorageFormComponent } from "../../../resource/storage/resource-storage-form.component";
import { CommonMeasurementUnitInputComponent } from "src/app/common/measurement/common-measurement-unit-input.component";
import { CommonMeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { CostEstimateForm } from "src/app/uni/research/funding/cost-estimate/coste-estimate";


@Component({
    selector: 'lab-input-material-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        CommonMeasurementUnitPipe,
        CommonMeasurementUnitInputComponent,

        HazardClassesSelectComponent,
        ResourceStorageFormComponent,
        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">
        </mat-form-field>

        <common-measurement-unit-input
            formControlName="baseUnit" 
            required>
            <mat-label>Units</mat-label>
        </common-measurement-unit-input>

        <ng-container *ngIf="baseUnit">
            <mat-form-field>
                <mat-label>Estimated amount required</mat-label>
                <input matInput formControlName="numUnitsRequired" />
                <div matTextSuffix>
                    <span [innerHTML]="baseUnit | commonMeasurementUnit"></span>
                </div>
            </mat-form-field>

            <lab-resource-provision-form 
                [form]="costEstimateForm"
                [provisioningUnit]="form.value.baseUnit!"
                [resourceType]="resourceType"
                [requestedUnits]="form.value.numUnitsRequired || 0">
            </lab-resource-provision-form>

            <lab-req-resource-storage-form formGroupName="storage">
            </lab-req-resource-storage-form>

            <lab-req-hazard-classes-select formControlName="hazardClasses">
                <span class="label">Hazard classes</span>
            </lab-req-hazard-classes-select>
        </ng-container>
    </form>
    `,
    styles: [`
    form {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    `],
})
export class InputMaterialResourceFormComponent {
    readonly formService = inject(ResourceFormService<InputMaterial, InputMaterialForm>);

    get resourceType() {
        return this.formService.resourceType;
    }

    get form(): InputMaterialForm {
        return this.formService.form;
    }

    get costEstimateForm(): CostEstimateForm {
        return this.form.controls.perUnitCostEstimate as CostEstimateForm;
    }

    get baseUnit(): string {
        return this.form.value?.baseUnit || '';
    }
}