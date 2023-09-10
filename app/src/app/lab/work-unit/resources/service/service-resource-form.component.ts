import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { RESOURCE_FORM_FACTORY, RESOURCE_TYPE, ResourceFormComponent, ResourceFormService } from "../common/resource-form.component";
import { Service, ServiceForm, serviceForm } from "./service";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ProvisionFormComponent } from "../common/provision/provision-form.component";

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
        ResourceFormComponent,
    ],
    template: `
    <lab-req-resource-form #resourceForm>
        <form *ngIf="resourceForm.form" [formGroup]="resourceForm.form">
            <mat-form-field>
                <mat-label>Name</mat-label>
                <input matInput formControlName="name" />
            </mat-form-field>

            <mat-checkbox formControlName="isLabTechService">
                Is performed by lab technician
            </mat-checkbox>

            <lab-req-provision-form>
            </lab-req-provision-form>
        </form>
    </lab-req-resource-form>
    `,
    providers: [
        { provide: RESOURCE_TYPE, useValue: 'service'},
        { provide: RESOURCE_FORM_FACTORY, useValue: () => serviceForm({})}
    ]
})
export class ServiceResourceFormComponent {
    readonly resourceFormService = inject(ResourceFormService<Service>);

    get form(): ServiceForm  {
        return this.resourceFormService.form as ServiceForm;
    }

    get isLabTechService() {
        return !!this.form.value.isLabTechService;
    }
}
