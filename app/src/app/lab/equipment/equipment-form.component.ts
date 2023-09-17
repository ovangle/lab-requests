import { CommonModule } from "@angular/common";
import { Component, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewChild, inject } from "@angular/core";
import { AbstractControl, FormArray, FormControl, FormGroup, FormGroupDirective, ReactiveFormsModule, Validators } from "@angular/forms";

import { Equipment, EquipmentPatch, EquipmentPatchErrors, EquipmentModelService, equipmentPatchFromEquipment, EquipmentContext } from './equipment';
import { LabType } from "../type/lab-type";
import { BehaviorSubject, Observable, Subscription, firstValueFrom, map, share } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EquipmentFormService } from "./equipment-form.service";

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
        MatInputModule
    ],
    template: `
    <form [formGroup]="form" (ngSubmit)="commitForm()">
        <mat-form-field>
            <mat-label>Name</mat-label>
            <input matInput 
                id="equipment-name" 
                formControlName="name" />
            <ng-container *ngIf="nameErrors$ | async as nameErrors">
                <mat-error *ngIf="nameErrors.required">
                    REQUIRED
                </mat-error>
                <mat-error *ngIf="nameErrors.notUnique">
                    NOT UNIQUE
                </mat-error>
            </ng-container>
        </mat-form-field> 

        <mat-checkbox formControlName="requiresTraining">
                This equipment requires induction before use
        </mat-checkbox>

        <ng-container *ngIf="form.controls.requiresTraining">
            <!-- TODO: Training required descriptions -->
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
    readonly _formService = inject(EquipmentFormService);

    @ViewChild('formActionControls', {static: true})
    formActionControls: TemplateRef<any>;

    get form() {
        return this._formService.form;
    }

    readonly patchValue$ = this._formService.patchValue$;
    readonly nameErrors$ = this._formService.patchErrors$.pipe(
        map(patchErrors => patchErrors?.name)
    );

    commitForm() {
        this._formService.commit();
    }
    resetForm() {
        this._formService.reset();
    }
}