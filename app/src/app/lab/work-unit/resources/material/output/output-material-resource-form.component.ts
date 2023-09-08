import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { ResourceFormComponent, RESOURCE_TYPE, ResourceFormService, RESOURCE_FORM_FACTORY } from "../../common/resource-form.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm, disableDependentControlsWithBaseUnitValidity } from "./output-material";
import { ResourceStorageFormComponent } from "../../common/storage/resource-storage-form.component";
import { ResourceDisposalFormComponent } from "../../common/disposal/resource-disposal-form.component";
import { HazardClassesSelectComponent } from "../../common/hazardous/hazard-classes-select.component";

@Component({
    selector: 'lab-req-output-material-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatFormFieldModule,
        MatInputModule,

        ResourceFormComponent,
        ResourceStorageFormComponent,
        ResourceDisposalFormComponent,
        HazardClassesSelectComponent
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <ng-container [formGroup]="resourceForm.form">
            <mat-form-field>
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" />
            </mat-form-field>

            <mat-form-field>
                <mat-label>Base unit</mat-label>
                <input matInput formControlName="baseUnit" />
            </mat-form-field>

            <ng-container *ngIf="baseUnit">
                <mat-form-field>
                    <mat-label>Estimated units produced</mat-label>
                    <input matInput type="number" formControlName="numUnitsProduced" />
                    <div matTextSuffix>{{baseUnit}}</div>
                </mat-form-field>

                <lab-req-resource-storage-form formGroupName="storage">
                </lab-req-resource-storage-form>

                <lab-req-resource-disposal-form formGroupName="disposal">
                </lab-req-resource-disposal-form>

                <lab-req-hazard-classes-select formControlName="hazardClasses">
                </lab-req-hazard-classes-select>
            </ng-container>
        </ng-container>
    </lab-req-resource-form>
    `,
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'output-material' },
        { provide: RESOURCE_FORM_FACTORY, useValue: () => createOutputMaterialForm({}) }
    ]
})
export class OutputMaterialResourceFormComponent {
    @ViewChild(ResourceFormComponent, {static: true})
    resourceForm: ResourceFormComponent<OutputMaterial, OutputMaterialForm>;

    constructor() {
        // disableDependentControlsWithBaseUnitValidity(this.resourceForm.form!);
    }


    get baseUnit(): string {
        return this.resourceForm?.form?.value?.baseUnit || '';
    }
}