import { AbstractControl, ControlContainer, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";

import { RESOURCE_STORAGE_TYPES, ResourceStorage, ResourceStorageType } from './resource-storage';
import { ChangeDetectorRef, Component, Input, SimpleChanges, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatCardModule } from "@angular/material/card";
import { SelectOtherDescriptionComponent } from "src/app/utils/forms/select-other-description.component";
import { CostEstimateForm, CostEstimateFormComponent, costEstimateForm, costEstimatesFromFormValue } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form.component";
import { differenceInCalendarWeeks } from "date-fns";

export type ResourceStorageForm = FormGroup<{
    type: FormControl<ResourceStorageType>;
    description: FormControl<string>;
    hasCostEstimates: FormControl<boolean>;
    estimatedCost: CostEstimateForm;
}>;

export function resourceStorageForm(): ResourceStorageForm {
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
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,

        SelectOtherDescriptionComponent,
        CostEstimateFormComponent
    ],
    template: `
        <h3>Storage</h3>
        <ng-container [formGroup]="form">
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

            <uni-research-funding-cost-estimate-form
                *ngIf="hasCostEstimates"
                [form]="form.controls.estimatedCost" 
                unitOfMeasurement="weeks"
                [quantityRequired]="numWeeksInProject"/>
        </ng-container>
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
    readonly _cdRef = inject(ChangeDetectorRef);

    readonly storageTypes = RESOURCE_STORAGE_TYPES;

    @Input({ required: true })
    form: ResourceStorageForm;

    @Input()
    storageStartDate: Date | null = null;

    @Input()
    storageEndDate: Date | null = null;

    ngOnChanges(changes: SimpleChanges) {
        const storageStartDate = changes['storageStartDate'];
        const storageEndDate = changes['storageEndDate'];
        if (storageStartDate || storageEndDate) {
            const hasCostEstimates = storageStartDate.currentValue && storageEndDate.currentValue;
            this.form.patchValue({hasCostEstimates});
            this._cdRef.detectChanges();
        }
    }

    get numWeeksInProject(): number {
        if (this.storageStartDate == null || this.storageEndDate == null) {
            return 0;
        } 
        return differenceInCalendarWeeks(this.storageStartDate, this.storageEndDate);
    }

    get isOtherTypeSelected() {
        return this.form.value.type === 'other';
    }

    get hasCostEstimates() {
        return this.storageStartDate && this.storageEndDate;
    }
}