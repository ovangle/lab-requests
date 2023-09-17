import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { OutputMaterial, OutputMaterialForm, createOutputMaterialForm, disableDependentControlsWithBaseUnitValidity } from "./output-material";
import { ResourceFormService } from "../../../resource/resource-form.service";
import { ResourceFormComponent } from "../../../resource/common/resource-form.component";
import { ResourceDisposalFormComponent } from "../../../resource/disposal/resource-disposal-form.component";
import { HazardClassesSelectComponent } from "../../../resource/hazardous/hazard-classes-select.component";
import { ResourceStorageFormComponent } from "../../../resource/storage/resource-storage-form.component";

@Component({
    selector: 'lab-output-material-resource-form',
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
    <lab-resource-form [formGroup]="form">
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
    </lab-resource-form>
    `
})
export class OutputMaterialResourceFormComponent {
    _formService = inject(ResourceFormService<OutputMaterial, OutputMaterialForm>)

    get form(): OutputMaterialForm {
        return this._formService.form;
    }

    get baseUnit(): string {
        return this.form.value.baseUnit || '';
    }
}