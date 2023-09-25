import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Service, ServiceForm, ServiceFormErrors, serviceForm } from "./service";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ResourceFormService } from "../../resource/resource-form.service";
import { ProvisionFormComponent } from "../../resource/provision/provision-form.component";
import { MatRadioModule } from "@angular/material/radio";

@Component({
    selector: 'lab-service-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,

        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
            <mat-error *ngIf="nameErrors?.required">
                A value is required
            </mat-error>
        </mat-form-field>

        <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description">
            </textarea>
        </mat-form-field>

        <p>Work towards this task is to be completed</p>
        <mat-radio-group formControlName="supplier">
            <mat-radio-button value="technician">
                By technician
            </mat-radio-button> <br/>
            <mat-radio-button value="researcher">
                By researcher
            </mat-radio-button> <br/>
            <mat-radio-button value="other">
                By external contractor
            </mat-radio-button> <br/>
        </mat-radio-group>

        <ng-container [ngSwitch]="supplier">
            <ng-container *ngSwitchCase="'other'">
                <mat-form-field>
                    <mat-label>Contractor name</mat-label>
                    <input matInput 
                           formControlName="externalSupplierDescription" />
                </mat-form-field>

                <lab-resource-provision-form [form]="form"
                    [canResearcherSupply]="true">
                </lab-resource-provision-form>
            </ng-container>
        </ng-container>
    </form>
    `
})
export class ServiceResourceFormComponent {
    readonly formService = inject(ResourceFormService<Service, ServiceForm>);

    get form(): ServiceForm {
        return this.formService.form;
    }

    get nameErrors(): ServiceFormErrors['name'] | null {
        return this.form.controls.name.errors as ServiceFormErrors['name'] | null;
    }

    get supplier(): 'technician' | 'researcher' | 'other' {
        return this.form.controls.supplier.value;
    }

    get isLabTechService() {
        return this.supplier == 'technician';
    }
}
