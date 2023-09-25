import { CommonModule } from "@angular/common";
import { Component, Injectable, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { Software, SoftwareForm, createSoftwareForm } from "./software";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ResourceFormService } from "../../resource/resource-form.service";
import { ProvisionFormComponent } from "../../resource/provision/provision-form.component";

@Component({
    selector: 'lab-software-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput
                id="software-name"
                formControlName="name"
            />
        </mat-form-field>

        <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput type="text"
                id="software-description"
                formControlName="description">
            </textarea>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Minimum version</mat-label>
            <input matInput type="text"
                id="software-min-version"
                formControlName="minVersion" />
        </mat-form-field>

        <mat-checkbox formControlName="isLicenseRequired">
            This software requires a licence seat
        </mat-checkbox>

        <lab-resource-provision-form *ngIf="isLicenseRequired" [form]="form"
            [canResearcherSupply]="false"
            provisioningUnit="per license">
        </lab-resource-provision-form>
    </form>
    `,
    styles: [`
        form {
            display: flex;
            flex-direction: column;
        }
    `],
})
export class SoftwareResourceFormComponent {
    readonly formService = inject(ResourceFormService<Software, SoftwareForm>);

    get form(): SoftwareForm {
        return this.formService.form;
    }

    get isLicenseRequired() {
        return !!this.form.value.isLicenseRequired;
    }
}
