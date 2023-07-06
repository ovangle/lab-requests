import { Component } from "@angular/core";
import { FormArray, FormGroup, NgControl, ReactiveFormsModule } from "@angular/forms";
import { createSoftwareResourceFormGroup, SoftwareResourceFormComponent, SoftwareResourceFormGroup } from "./software-resource-form.component";



@Component({
    selector: 'lab-software-resource-list',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        SoftwareResourceFormComponent
    ],
    template: `
        <div formArrayName="aliases">
            <h2>Required software</h2>
           
            <button type="button" (click)="addSoftware()">+ Add required software</button>

            <div *ngFor="let software of software.controls; let id=$index">
                <lab-software-resource-form 
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

    get softwares(): FormArray<SoftwareResourceFormGroup> {
        return this.control.control as FormArray;
    }

    addSoftware() {
        const group = createSoftwareResourceFormGroup();
        this.softwares.push(group);
    }

}