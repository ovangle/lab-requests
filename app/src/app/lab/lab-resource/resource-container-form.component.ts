import { CommonModule } from "@angular/common";
import { Component, Input, inject } from "@angular/core";
import { AbstractControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { GetResourceAtFn, ResourceContainerForm, ResourceContainerFormControls, ResourceContainerFormService, isResourceContainerForm } from "./resource-container-form.service";
import { EquipmentLeaseTableComponent } from "../lab-resources/equipment-lease/equipment-lease-table.component";
import { SoftwareLeaseTableComponent } from "../lab-resources/software-lease/software-resource-table.component";
import { InputMaterialTableComponent } from "../lab-resources/input-material/input-material-resource-table.component";
import { OutputMaterialTableComponent } from "../lab-resources/output-material/output-material-resource-table.component";
import { T } from "@angular/cdk/keycodes";
import { ResourceContainer } from "./resource-container";

@Component({
    selector: 'lab-resource-container-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        EquipmentLeaseTableComponent,
        SoftwareLeaseTableComponent,
        InputMaterialTableComponent,
        OutputMaterialTableComponent
    ],
    template: `
    @if (form) {
        <ng-container [formGroup]="form">
            <div class="equipment-lease-table-container">
            <h3>Equipment leases</h3>
            <lab-equipment-lease-table />
            </div>
        
            <div class="software-lease-table-container">
                <h3>Software</h3>
                <lab-software-lease-table />
            </div>

            <div class="input-material-table-container">
                <h3>Input materials</h3>
                <lab-input-material-table />
            </div>

            <div class="output-material-table-container">
                <h3>Output materials</h3>
                <lab-output-material-table />
            </div>
        </ng-container>
    }
    `
})
export class LabResourceContainerFormComponent {
    readonly containerForms = inject(ResourceContainerFormService);

    @Input({ required: true })
    form: FormGroup<any> | undefined;

    @Input({ required: true })
    container: ResourceContainer | null = null;

    ngOnInit() {
        this.containerForms.setupForm(this.form!, this.container);
    }

    ngOnDestroy() {
        this.containerForms.teardownForm();
    }

}