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


@Component({
    selector: 'lab-input-material-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        HazardClassesSelectComponent,
        ResourceStorageFormComponent,
        ProvisionFormComponent,
    ],
    template: `
    <lab-generic-resource-form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name">
        </mat-form-field>

        <mat-form-field>
            <mat-label>Base unit</mat-label>
            <input matInput formControlName="baseUnit" />
        </mat-form-field>

        <ng-container *ngIf="baseUnit">
            <mat-form-field>
                <mat-label>Estimated amount required</mat-label>
                <input matInput formControlName="numUnitsRequired" />
                <div matTextSuffix>{{baseUnit}}</div>
            </mat-form-field>

            <lab-resource-provision-form [form]="form"
                [provisioningUnit]="'per\u00A0' + form.value.baseUnit"
                [resourceType]="resourceType">
            </lab-resource-provision-form>

            <lab-req-resource-storage-form formGroupName="storage">
            </lab-req-resource-storage-form>

            <lab-req-hazard-classes-select formControlName="hazardClasses">
                <span class="label">Hazard classes</span>
            </lab-req-hazard-classes-select>
        </ng-container>
    </lab-generic-resource-form>
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
}