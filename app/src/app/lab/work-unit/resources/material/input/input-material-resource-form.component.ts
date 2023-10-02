import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { InputMaterial } from "./input-material";
import { ResourceFormService } from "../../../resource/resource-form.service";
import { HazardClassesSelectComponent } from "../../../resource/hazardous/hazard-classes-select.component";
import { ProvisionFormComponent } from "../../../resource/provision/provision-form.component";
import { ResourceStorageForm, ResourceStorageFormComponent, createResourceStorageForm } from "../../../resource/storage/resource-storage-form.component";
import { CommonMeasurementUnitInputComponent } from "src/app/common/measurement/common-measurement-unit-input.component";
import { CommonMeasurementUnitPipe } from "src/app/common/measurement/common-measurement-unit.pipe";
import { CostEstimateFormComponent } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form.component";
import { CostEstimateForm, costEstimateForm } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form";
import { HazardClass } from "../../../resource/hazardous/hazardous";


export type InputMaterialForm = FormGroup<{
    name: FormControl<string>;
    baseUnit: FormControl<string>;

    numUnitsRequired: FormControl<number>;

    storage: ResourceStorageForm;
    hazardClasses: FormControl<HazardClass[]>;

    perUnitCostEstimate: CostEstimateForm;
}>;

export function createInputMaterialForm(): InputMaterialForm {
    return new FormGroup({
        name: new FormControl<string>(
            '',
            {nonNullable: true, validators: [Validators.required]}
        ),
        baseUnit: new FormControl<string>(
           '',
            {nonNullable: true, validators: [Validators.required]}
        ),
        numUnitsRequired: new FormControl<number>(
            0,
            {nonNullable: true}
        ),
        perUnitCostEstimate: costEstimateForm(),
        storage: createResourceStorageForm(),
        hazardClasses: new FormControl<HazardClass[]>([], {nonNullable: true})
    });
}

export type InputMaterialFormErrors = ValidationErrors & {
    name?: { required: string | null };
    baseUnit?: {required: string | null };
};

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

        CostEstimateFormComponent,
        HazardClassesSelectComponent,
        ResourceStorageFormComponent,
        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">

            <mat-error *ngIf="nameErrors?.required">
                A value is required
            </mat-error>
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

            <uni-research-funding-cost-estimate-form
                [form]="form.controls.perUnitCostEstimate">
            </uni-research-funding-cost-estimate-form>
            <!--
            <lab-resource-provision-form 
                [form]="costEstimateForm"
                [provisioningUnit]="form.value.baseUnit!"
                [resourceType]="resourceType"
                [requestedUnits]="form.value.numUnitsRequired || 0">
            </lab-resource-provision-form>
            -->

            <lab-resource-storage-form 
                [form]="form.controls.storage" />

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

    get baseUnit(): string {
        return this.form.value?.baseUnit || '';
    }

    get nameErrors(): InputMaterialFormErrors['name'] | null {
        const control = this.form.controls.name;
        if (control.valid) {
            debugger;
        }
        return control.errors as InputMaterialFormErrors['name'] | null;
    }

}