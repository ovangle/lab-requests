import { AbstractControl, ControlContainer, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";

import { RESOURCE_STORAGE_TYPES, ResourceStorage, ResourceStorageType } from './resource-storage';
import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { CostEstimateForm, costEstimateForm, costEstimatesFromFormValue } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form";

export type ResourceStorageForm = FormGroup<{
    type: FormControl<ResourceStorageType>;
    description: FormControl<string>;
    hasCostEstimates: FormControl<boolean>;
    estimatedCost: CostEstimateForm;
}>;

export function createResourceStorageForm(): ResourceStorageForm {
    return new FormGroup({
        type: new FormControl<ResourceStorageType>('general', { nonNullable: true }),
        description: new FormControl<string>(
            '',
            { nonNullable: true, validators: [Validators.required] }
        ),
        hasCostEstimates: new FormControl(false, { nonNullable: true }),
        estimatedCost: costEstimateForm()
    });
}

export function resourceStorageFromFormValue(form: ResourceStorageForm): ResourceStorage {
    if (!form.valid) {
        throw new Error('Invalid form has no value');
    }
    const description = form.value.type === 'other'
        ? form.value.description
        : form.value.type!;

    const estimatedCost = form.value.hasCostEstimates
        ? costEstimatesFromFormValue(form.controls.estimatedCost)
        : null;
    return new ResourceStorage({
        description,
        estimatedCost
    });
}

export function patchResourceStorageFormValue(form: ResourceStorageForm, storage: ResourceStorage, options?: any) {
    form.patchValue({
        type: storage.type,
        description: storage.description,
        hasCostEstimates: storage.estimatedCost != null,
        estimatedCost: storage.estimatedCost || {}
    }, options);
}

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
        <mat-card-content [formGroup]="form">
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
                    formControlName="description">
                </lab-req-select-other-description>
            </div>

            <ng-container *ngIf="form.value.description">
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

    @Input({ required: true })
    form: ResourceStorageForm;

    get isOtherTypeSelected() {
        return this.form.value.description === 'other';
    }

}