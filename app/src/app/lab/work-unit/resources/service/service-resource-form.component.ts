import { CommonModule } from "@angular/common";
import { Component, ViewChild, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Service, ServiceForm, serviceForm } from "./service";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ResourceFormService } from "../../resource/resource-form.service";
import { ProvisionFormComponent } from "../../resource/provision/provision-form.component";

@Component({
    selector: 'lab-service-resource-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,

        ProvisionFormComponent,
    ],
    template: `
    <form [formGroup]="form">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
        </mat-form-field>

        <mat-checkbox formControlName="isLabTechService">
            Is performed by lab technician
        </mat-checkbox>

        <lab-resource-provision-form [form]="form">
        </lab-resource-provision-form>
    </form>
    `
})
export class ServiceResourceFormComponent {
    readonly formService = inject(ResourceFormService<Service, ServiceForm>);

    get form(): ServiceForm {
        return this.formService.form;
    }

    get isLabTechService() {
        return !!this.form.value.isLabTechService;
    }
}
