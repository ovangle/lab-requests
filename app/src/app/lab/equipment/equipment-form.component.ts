import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Equipment, EquipmentPatch, EquipmentPatchErrors } from './equipment';
import { EquipmentForm, EquipmentFormService, equipmentPatchFromForm } from "./equipment-form.service";
import { EquipmentTagInputComponent } from "./tag/equipment-tag-input.component";
import { EquipmentTrainingDescriptionsInputComponent } from "./training/training-descriptions-input.component";

export const equipmentFixtures: Equipment[] = [];

@Component({
    selector: 'lab-equipment-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,

        EquipmentTagInputComponent,
        EquipmentTrainingDescriptionsInputComponent,
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="commitForm($event)">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput 
                id="equipment-name" 
                formControlName="name" />
            <mat-error *ngIf="nameErrors?.required">
                A value is required
            </mat-error>
            <mat-error *ngIf="nameErrors?.notUnique">
                An equipment already exists with that name
            </mat-error>
        </mat-form-field> 

        <mat-form-field>
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description">
            </textarea>
        </mat-form-field>  

        <lab-equipment-tags-input formControlName="tags">
            <mat-label>Tags</mat-label>
        </lab-equipment-tags-input>

        <lab-equipment-training-descriptions-input formControlName="trainingDescriptions">
        </lab-equipment-training-descriptions-input>


        <div class="form-actions"> 
            <button mat-raised-button type="submit" 
                color="primary"
                [disabled]="form.invalid">
                <mat-icon>save</mat-icon> save
            </button>
        </div>
    </form>
    `,
    styles: [`
    .form-actions button {
        float: right;
    }
    `],
    providers: [
        EquipmentFormService
    ],
    exportAs: 'form'
})
export class LabEquipmentFormComponent {
    @Input()
    committed: Equipment | null = null;

    get isCreate() {
        return this.committed == null;
    }

    @Input({required: true})
    form: EquipmentForm;

    @Output()
    requestCommit = new EventEmitter<EquipmentPatch>();

    @Output()
    requestReset = new EventEmitter<void>();

    @ViewChild('formActionControls', {static: true})
    formActionControls: TemplateRef<any>;

    get nameErrors(): EquipmentPatchErrors['name'] | null {
        return this.form.controls.name.errors as any; 
    }

    get committedTrainingDescriptions(): string[] {
        return this.committed?.trainingDescriptions || [];
    }

    get trainingDescripionsFormArr(): FormControl<string[]> {
        return this.form.controls.trainingDescriptions;
    }

    commitForm(evt: Event) {
        const patch = equipmentPatchFromForm(this.form);
        this.requestCommit.emit(patch)
        evt.preventDefault();
    }
    resetForm() {
        this.requestReset.emit();
    }
}