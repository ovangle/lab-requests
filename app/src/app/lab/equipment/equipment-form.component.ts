import { CommonModule } from "@angular/common";
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from "@angular/forms";

import { Equipment, EquipmentPatch, EquipmentPatchErrors, EquipmentModelService, equipmentPatchFromEquipment, EquipmentContext } from './equipment';
import { LabType } from "../type/lab-type";
import { BehaviorSubject, Observable, Subscription, firstValueFrom, map, share } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EquipmentForm, EquipmentFormService, equipmentPatchFromForm } from "./equipment-form.service";
import { MatListModule } from "@angular/material/list";
import { EquipmentTrainingListFormComponent } from "./training/training-list-form.component";

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

        EquipmentTrainingListFormComponent
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="commitForm()">
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

        <mat-checkbox formControlName="requiresTraining">
            This equipment requires induction before use
        </mat-checkbox>

        <ng-container *ngIf="isTrainingRequired">
            <lab-equipment-training-list-form 
                [committed]="committedTrainingDescriptions"
                [form]="trainingDescripionsFormArr"
                (requestCommit)="requestTrainingCommitted($event)">
            </lab-equipment-training-list-form>
        </ng-container> 

        <div class="form-actions"> 
            <ng-container [ngTemplateOutlet]="formActionControls"></ng-container>
        </div>
    </form>

    <ng-template #formActionControls>
        <button mat-button type="submit" [disabled]="form.invalid">
            <mat-icon>save</mat-icon>
        </button>
    </ng-template>
    `,
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

    get isTrainingRequired() {
        return this.form.controls.requiresTraining.value;
    }

    get committedTrainingDescriptions(): string[] {
        return this.committed?.trainingDescriptions || [];
    }

    get trainingDescripionsFormArr(): FormArray<FormControl<string>> {
        return this.form.controls.trainingDescriptions;
    }

    requestTrainingCommitted(descriptions: string[]) {
        // TODO: What works here in both create and update?
        // Sometimes it's too early to commit.
        this.commitForm();
    }

    commitForm() {
        const patch = equipmentPatchFromForm(this.form);
        this.requestCommit.next(patch)
    }
    resetForm() {
        this.requestReset.next();
    }
}