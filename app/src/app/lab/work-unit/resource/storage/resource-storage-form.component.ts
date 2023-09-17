import { AbstractControl, ControlContainer, FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";

import { RESOURCE_STORAGE_TYPES, ResourceStorage, ResourceStorageForm, ResourceStorageType, isResourceStorageForm } from './resource-storage';
import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";

@Component({
    selector: 'lab-resource-storage-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        SelectOtherDescriptionComponent
    ],
    template: `
    <mat-card>
        <mat-card-header><h3>Storage</h3></mat-card-header>
        <mat-card-content [formGroup]="formGroup">
            <div class="d-flex">
                <mat-form-field>
                    <mat-label>Storage type</mat-label>
                    <mat-select formControlName="type">
                        <mat-option [value]="null">none required</mat-option>
                        <mat-option *ngFor="let storageType of storageTypes"
                                    [value]="storageType">
                            {{storageType}}
                        </mat-option>
                    </mat-select>
                </mat-form-field>

                <lab-req-select-other-description
                    [isOtherSelected]="isOtherTypeSelected"
                    formControlName="otherDescription">
                </lab-req-select-other-description>
            </div>

            <ng-container *ngIf="formGroup.value.type">
                <mat-form-field>
                    <mat-label>Estimated space</mat-label>
                    <input matInput type="number" formControlName="estimatedSpace" />
                    <div matTextSuffix>&nbsp;m<sup>2</sup></div>
                </mat-form-field>
            </ng-container>
        </mat-card-content>
    </mat-card>
    `,
    styles: [`
    :host {
        padding-bottom: 1em;
    }
    mat-form-field {
        width: 100%;
    }
    div[matTextSuffix] {
        padding-left: 0.2em;
    }
    `]
})
export class ResourceStorageFormComponent {
    readonly storageTypes = RESOURCE_STORAGE_TYPES;

    controlContainer = inject(ControlContainer);

    get formGroup(): ResourceStorageForm {
        if (!isResourceStorageForm(this.controlContainer.control)) {
            throw new Error('Expected a resource storage form');
        }
        return this.controlContainer.control;
    }

    get isOtherTypeSelected(): boolean {
        return this.formGroup.value.type === 'other';
    }

}