import { CommonModule } from "@angular/common";
import { Component, ViewChild } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { RESOURCE_FORM_FACTORY, RESOURCE_TYPE, ResourceFormComponent } from "../../common/resource-form.component";
import { HazardClassesSelectComponent } from "../../common/hazardous/hazard-classes-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ResourceStorageFormComponent } from "../../common/storage/resource-storage-form.component";
import { MatInputModule } from "@angular/material/input";
import { ProvisionFormComponent } from "../../common/provision/provision-form.component";
import { InputMaterial, InputMaterialForm, createInputMaterialForm } from "./input-material";


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
        ResourceFormComponent,
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <form [formGroup]="resourceForm.form">
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

                <lab-req-provision-form [form]="resourceForm.form"
                    [provisioningUnit]="'per\u00A0' + resourceForm.form.value.baseUnit"
                    [resourceType]="resourceForm.resourceType">
                </lab-req-provision-form>

                <lab-req-resource-storage-form formGroupName="storage">
                </lab-req-resource-storage-form>

                <lab-req-hazard-classes-select formControlName="hazardClasses">
                    <span class="label">Hazard classes</span>
                </lab-req-hazard-classes-select>
            </ng-container>
        </form>
    </lab-req-resource-form>
    `,
    styles: [`
    form {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    `],
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'input-material' },
        { provide: RESOURCE_FORM_FACTORY, useValue: () => createInputMaterialForm({}) }
    ]
})
export class InputMaterialResourceFormComponent {
    @ViewChild(ResourceFormComponent, {static: true})
    resourceForm: ResourceFormComponent<InputMaterial, InputMaterialForm>;

    get baseUnit(): string {
        return this.resourceForm.form?.value?.baseUnit || '';
    }
}