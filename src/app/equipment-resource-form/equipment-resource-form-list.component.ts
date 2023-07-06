import { Component } from "@angular/core";
import { FormArray, FormGroup, NgControl, ReactiveFormsModule } from "@angular/forms";
import { EquipmentResourceFormComponent, EquipmentResourceFormGroup } from "./equipment-resource-form.component";


@Component({
    selector: 'lab-equipment-resource-list',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        EquipmentResourceFormComponent 
    ],
    template: `
        <div formArrayName="aliases">
            <h2>Required software</h2>
           
            <button type="button" (click)="addSoftware()">+ Add required software</button>

            <div *ngFor="let software of software.controls; let id=$index">
                <lab-equipment-resource-form 
                    [id]="id"
                    [form]="software">
                </lab-software-resource-form>
            </div>
        </div>
    `
})
export class SoftwareResourceListComponent {
    constructor(
        readonly control: NgControl
    ) {}

    get softwares(): FormArray<EquipmentResourceFormGroup> {
        return this.control.control as FormArray;
    }

    addSoftware() {
        const group = createEquipmentResourceForm();
        this.softwares.push(group);
    }

}