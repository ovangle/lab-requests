import { CommonModule } from "@angular/common";
import { Component, Input, ViewChild, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { EquipmentLease } from "./equipment-lease";
import { Observable, defer, filter, map, startWith } from "rxjs";
import { EquipmentSearchComponent } from "src/app/lab/equipment/equipment-search.component";
import { ResourceFormService } from "../../resource/resource-form.service";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { EquipmentTrainingAcknowlegementComponent } from "src/app/lab/equipment/training/training-acknowlegment-input.component";
import { CostEstimateForm, costEstimateForm } from "src/app/uni/research/funding/cost-estimate/cost-estimate-form.component";
import { EquipmentRiskAssessmentFileInputComponent } from "./risk-assessment-file-input.component";
import { EquipmentLike } from "src/app/lab/equipment/equipment-like";
import { Equipment } from "src/app/lab/equipment/common/equipment";

export type EquipmentLeaseForm = FormGroup<{
    equipment: FormControl<EquipmentLike | null>;
    equipmentTrainingCompleted: FormControl<string[]>;
    requiresAssistance: FormControl<boolean>;

    setupInstructions: FormControl<string>;
    usageCostEstimate: CostEstimateForm;
}>;

export function equipmentLeaseForm(lease?: Partial<EquipmentLease>): EquipmentLeaseForm {
    return new FormGroup({
        equipment: new FormControl<EquipmentLike | null>(
            lease?.equipment || null as any, 
            { validators: [Validators.required] }
        ),
        equipmentTrainingCompleted: new FormControl<string[]>(
            lease?.equipmentTrainingCompleted|| [], 
            {nonNullable: true}
        ),
        requiresAssistance: new FormControl<boolean>(
            !!(lease?.requiresAssistance), 
            {nonNullable: true}
        ),
        setupInstructions: new FormControl<string>(
            lease?.setupInstructions || '', 
            {nonNullable: true}
        ),
        usageCostEstimate: costEstimateForm()
    });
}

export type EquipmentLeaseFormErrors = ValidationErrors & {
    equipment?: { required: string | null; };
}

@Component({
    selector: 'lab-equipment-lease-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,

        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,

        EquipmentSearchComponent,
        EquipmentTrainingAcknowlegementComponent,
        EquipmentRiskAssessmentFileInputComponent
    ],
    template: `
    <form [formGroup]="form">
        <lab-equipment-search formControlName="equipment">
            <mat-label>Equipment</mat-label>
        </lab-equipment-search>

        <ng-container *ngIf="selectedEquipmentTrainingDescriptions$ | async as trainingDescriptions">
            <lab-equipment-training-acknowledgement
                [trainingDescriptions]="trainingDescriptions"
                formControlName="equipmentTrainingCompleted" />
        </ng-container>

        <ng-container *ngIf="selectedEquipment$ | async as equipment">
            <mat-checkbox formControlName="requiresAssistance">
                I require additional assistance using this equipment
            </mat-checkbox>
        </ng-container>

        <ng-container>
            <lab-equipment-risk-assessment-file-input
                [container_id]="workUnitId">
            </lab-equipment-risk-assessment-file-input>
        </ng-container>
    </form>
    `,
})
export class EquipmentLeaseFormComponent {
    readonly formService = inject(ResourceFormService<EquipmentLease, EquipmentLeaseForm>);

    @Input()
    workUnitId: string;

    get form(): EquipmentLeaseForm {
        return this.formService.form;
    }

    get equipmentControl(): FormControl<EquipmentLike | null> {
        return this.form.controls.equipment;
    }

    readonly selectedEquipment$: Observable<EquipmentLike | null> = defer(
        () => this.equipmentControl.valueChanges.pipe(
            startWith(this.equipmentControl.value),
            map((value) => {
                if (!this.equipmentControl.valid) {
                    return null;
                }
                return value; 
            })
        )
    );

    readonly selectedEquipmentTrainingDescriptions$: Observable<string[] | null> = defer(
        () => this.selectedEquipment$.pipe(
            map(equipment => {
                if (equipment instanceof Equipment) {
                    return equipment.trainingDescriptions;
                }
                return null;
            })
        )
    );
}