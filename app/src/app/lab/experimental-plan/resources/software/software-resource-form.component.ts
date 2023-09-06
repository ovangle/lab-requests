import { CommonModule } from "@angular/common";
import { Component, Injectable, ViewChild } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { RESOURCE_FORM_FACTORY, RESOURCE_TYPE, ResourceFormComponent, ResourceFormService } from "../common/resource-form.component";
import { Software, SoftwareForm, createSoftwareForm } from "./software";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ProvisionFormComponent } from "../common/provision/provision-form.component";

@Component({
    selector: 'lab-req-software-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        ProvisionFormComponent,
        ResourceFormComponent,
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <form *ngIf="resourceForm.form" [formGroup]="resourceForm.form">
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

            <lab-req-provision-form *ngIf="isLicenseRequired" [form]="resourceForm.form"
                [canResearcherSupply]="false"
                provisioningUnit="per license">
            </lab-req-provision-form>
        </form>
    </lab-req-resource-form>
    `,
    styles: [`


        form {
            display: flex;
            flex-direction: column;
        }
    `],
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'software' },
        { provide: RESOURCE_FORM_FACTORY, useValue: () => createSoftwareForm({}) }
    ]
})
export class SoftwareResourceFormComponent {
    @ViewChild(ResourceFormComponent, {static: true})
    resourceForm: ResourceFormComponent<Software, SoftwareForm>;

    get isLicenseRequired() {
        return !!this.resourceForm.form?.value.isLicenseRequired;
    }
}
